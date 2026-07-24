package com.phototrip.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.http.javanet.NetHttpTransport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.io.IOException;
import java.util.Collections;

@Service
public class GoogleAuthService {

    private final GoogleIdTokenVerifier verifier;
    // TODO: thay bằng repository/service user thật của bạn (Oracle + iBATIS/JPA)
    private final UserRepository userRepository;
    // TODO: thay bằng service phát hành JWT hiện có của project (nếu đã có sẵn)
    private final JwtIssuer jwtIssuer;

    public GoogleAuthService(
            @Value("${google.client-id}") String googleClientId,
            UserRepository userRepository,
            JwtIssuer jwtIssuer
    ) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
        this.userRepository = userRepository;
        this.jwtIssuer = jwtIssuer;
    }

    public AuthDtos.GoogleLoginResponse login(String googleIdToken) {
        GoogleIdToken.Payload payload = verify(googleIdToken);

        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        AppUser user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.createFromGoogle(googleId, email, name, picture));

        // Nếu user đã tồn tại nhưng thông tin Google thay đổi (đổi tên/avatar) thì đồng bộ lại
        userRepository.syncProfile(user.id(), name, picture);

        String appJwt = jwtIssuer.issue(user.id(), email);

        return new AuthDtos.GoogleLoginResponse(
                appJwt,
                new AuthDtos.UserDto(user.id(), name, email, picture)
        );
    }

    private GoogleIdToken.Payload verify(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new InvalidGoogleTokenException("Google ID token không hợp lệ hoặc đã hết hạn.");
            }
            return idToken.getPayload();
        } catch (GeneralSecurityException | IOException e) {
            throw new InvalidGoogleTokenException("Không thể xác thực Google ID token.");
        }
    }

    /** Ném lỗi này -> map sang HTTP 401 trong @ControllerAdvice hiện có của project */
    public static class InvalidGoogleTokenException extends RuntimeException {
        public InvalidGoogleTokenException(String message) { super(message); }
    }

    // ---- Các interface placeholder, thay bằng lớp thật trong project của bạn ----

    public interface UserRepository {
        java.util.Optional<AppUser> findByGoogleId(String googleId);
        AppUser createFromGoogle(String googleId, String email, String name, String picture);
        void syncProfile(String userId, String name, String picture);
    }

    public interface JwtIssuer {
        String issue(String userId, String email);
    }

    public record AppUser(String id, String googleId, String email) {}
}
