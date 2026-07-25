package com.phototrip.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class VnpayService {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;          // Mã website merchant do VNPay cấp

    @Value("${vnpay.hash-secret}")
    private String hashSecret;       // Secret key merchant do VNPay cấp — KHÔNG lộ ra frontend

    @Value("${vnpay.pay-url}")
    private String payUrl;           // Sandbox: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

    @Value("${vnpay.return-url}")
    private String returnUrl;        // vd: https://yourdomain.vn/payment/vnpay-return (trang FE xử lý kết quả)

    // TODO: thay bằng repository/service đơn hàng thật (Oracle) của bạn
    private final OrderRepository orderRepository;

    public VnpayService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /** Bước 1: tạo URL thanh toán, redirect người dùng sang URL này (window.location.href). */
    public String createPaymentUrl(String orderId, long amountVnd, String orderInfo, String clientIp) {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amountVnd * 100)); // VNPay yêu cầu nhân 100 (đơn vị: xu)
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", orderId);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", clientIp);
        params.put("vnp_CreateDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

        String query = buildQuery(params, true);
        String hashData = buildQuery(params, false);
        String secureHash = hmacSHA512(hashSecret, hashData);
        return payUrl + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    /** Bước 2: verify chữ ký khi VNPay redirect người dùng về (GET /payments/vnpay/return). */
    public VnpayVerifyResult verifyCallback(Map<String, String> allParams) {
        Map<String, String> params = new TreeMap<>(allParams);
        String receivedHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        String hashData = buildQuery(params, false);
        String calculatedHash = hmacSHA512(hashSecret, hashData);

        boolean validSignature = calculatedHash.equalsIgnoreCase(receivedHash);
        boolean paymentSuccess = "00".equals(params.get("vnp_ResponseCode"));
        String orderId = params.get("vnp_TxnRef");

        return new VnpayVerifyResult(
                validSignature && paymentSuccess,
                validSignature,
                orderId,
                params.get("vnp_TransactionNo"),
                params.get("vnp_PayDate"),
                params.get("vnp_ResponseCode")
        );
    }

    /**
     * Bước 3 (QUAN TRỌNG NHẤT): endpoint IPN — VNPay gọi server-to-server, độc lập với
     * trình duyệt người dùng. Đây là nguồn xác nhận đáng tin cậy duy nhất để thực sự
     * cộng dung lượng cho user, vì bước 2 (return URL) có thể bị người dùng đóng trình
     * duyệt giữa chừng hoặc giả mạo tham số trên URL.
     * Logic verify giống verifyCallback, sau đó cập nhật trạng thái đơn hàng trong DB.
     */
    public VnpayVerifyResult handleIpn(Map<String, String> allParams) {
        VnpayVerifyResult result = verifyCallback(allParams);
        if (result.validSignature() && result.success()) {
            // TODO: idempotent — kiểm tra đơn hàng chưa được xử lý trước đó rồi mới cộng dung lượng
            orderRepository.markPaid(result.orderId(), result.transactionNo());
        }
        return result;
    }

    private String buildQuery(Map<String, String> params, boolean urlEncodeValue) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : params.entrySet()) {
            if (e.getValue() == null || e.getValue().isEmpty()) continue;
            if (sb.length() > 0) sb.append('&');
            sb.append(e.getKey()).append('=');
            sb.append(urlEncodeValue ? urlEncode(e.getValue()) : urlEncode(e.getValue()));
        }
        return sb.toString();
    }

    private String urlEncode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo chữ ký VNPay", e);
        }
    }

    public record VnpayVerifyResult(
            boolean success,
            boolean validSignature,
            String orderId,
            String transactionNo,
            String payDate,
            String responseCode
    ) {}

    public interface OrderRepository {
        void markPaid(String orderId, String transactionNo);
    }
}
