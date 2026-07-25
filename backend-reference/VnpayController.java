package com.phototrip.payment;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
public class VnpayController {

    private final VnpayService vnpayService;
    // TODO: thay bằng service/repository đơn hàng + gói lưu trữ thật của bạn
    private final PlanPricingService planPricingService;

    public VnpayController(VnpayService vnpayService, PlanPricingService planPricingService) {
        this.vnpayService = vnpayService;
        this.planPricingService = planPricingService;
    }

    public record CreatePaymentRequest(String planId) {}
    public record CreatePaymentResponse(String paymentUrl, String orderId) {}
    public record ReturnResponse(boolean success, String orderId, String planId, String message,
                                  Long amount, String transactionNo, String payDate) {}

    /** FE gọi khi bấm "Thanh toán qua VNPay" ở màn chọn gói. */
    @PostMapping("/create-payment")
    public ResponseEntity<CreatePaymentResponse> createPayment(
            @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest
    ) {
        PlanPricingService.Plan plan = planPricingService.getById(request.planId());
        String orderId = "PT" + System.currentTimeMillis();
        // TODO: lưu đơn hàng (orderId, planId, amount, userId, status=PENDING) vào DB trước khi trả URL

        String clientIp = httpRequest.getRemoteAddr();
        String orderInfo = "Nang cap TripAlbum goi " + plan.label();
        String url = vnpayService.createPaymentUrl(orderId, plan.totalPrice(), orderInfo, clientIp);

        return ResponseEntity.ok(new CreatePaymentResponse(url, orderId));
    }

    /**
     * VNPay redirect trình duyệt người dùng về đây sau khi thanh toán xong.
     * FE gọi lại endpoint này (forward nguyên query string) để lấy kết quả hiển thị.
     * Đây chỉ là xác nhận HIỂN THỊ — nguồn xác nhận thật để cộng dung lượng là /ipn.
     */
    @GetMapping("/return")
    public ResponseEntity<ReturnResponse> handleReturn(@RequestParam Map<String, String> allParams) {
        VnpayService.VnpayVerifyResult result = vnpayService.verifyCallback(allParams);
        PlanPricingService.Plan plan = planPricingService.findByOrderId(result.orderId());

        String message = !result.validSignature()
                ? "Chữ ký không hợp lệ, giao dịch có thể đã bị can thiệp."
                : result.success() ? "Giao dịch thành công" : "Giao dịch không thành công hoặc đã bị hủy.";

        return ResponseEntity.ok(new ReturnResponse(
                result.success(),
                result.orderId(),
                plan != null ? plan.id() : null,
                message,
                plan != null ? plan.totalPrice() : null,
                result.transactionNo(),
                result.payDate()
        ));
    }

    /**
     * Endpoint IPN — cấu hình URL này trong hồ sơ merchant trên cổng VNPay.
     * VNPay gọi trực tiếp server-to-server (không qua trình duyệt người dùng), nên
     * PHẢI public ra internet được (dùng ngrok/Cloudflare Tunnel lúc dev).
     * Đây là nơi DUY NHẤT nên thực sự cộng dung lượng cho user.
     */
    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> handleIpn(@RequestParam Map<String, String> allParams) {
        VnpayService.VnpayVerifyResult result = vnpayService.handleIpn(allParams);
        // VNPay yêu cầu response đúng định dạng RspCode/Message theo tài liệu tích hợp
        if (!result.validSignature()) {
            return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid signature"));
        }
        return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
    }

    public interface PlanPricingService {
        Plan getById(String planId);
        Plan findByOrderId(String orderId);
        record Plan(String id, String label, long totalPrice) {}
    }
}
