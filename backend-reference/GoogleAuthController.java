package com.phototrip.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
// TODO: nếu project đã có @CrossOrigin/CorsConfig global thì bỏ dòng dưới, tránh khai báo trùng
@CrossOrigin(origins = {"http://localhost:5173"}, allowCredentials = "true")
public class GoogleAuthController {

    private final GoogleAuthService googleAuthService;
    // TODO: thay bằng service đọc user hiện tại từ SecurityContext của project (đã có sẵn thường)
    private final CurrentUserService currentUserService;

    public GoogleAuthController(GoogleAuthService googleAuthService, CurrentUserService currentUserService) {
        this.googleAuthService = googleAuthService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/google")
    public ResponseEntity<AuthDtos.GoogleLoginResponse> loginWithGoogle(
            @RequestBody AuthDtos.GoogleLoginRequest request
    ) {
        AuthDtos.GoogleLoginResponse response = googleAuthService.login(request.idToken());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDtos.UserDto> me(@AuthenticationPrincipal Object principal) {
        // TODO: thay bằng cách lấy user hiện tại thật của project (JWT filter đã set
        // SecurityContext trước khi request tới đây). Nếu chưa có JWT filter,
        // xem ghi chú "JWT filter tối thiểu" trong README.md
        AuthDtos.UserDto user = currentUserService.getCurrentUser(principal);
        return ResponseEntity.ok(user);
    }

    @ExceptionHandler(GoogleAuthService.InvalidGoogleTokenException.class)
    public ResponseEntity<ErrorBody> handleInvalidGoogleToken(GoogleAuthService.InvalidGoogleTokenException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorBody(ex.getMessage()));
    }

    public record ErrorBody(String message) {}

    public interface CurrentUserService {
        AuthDtos.UserDto getCurrentUser(Object principal);
    }
}
