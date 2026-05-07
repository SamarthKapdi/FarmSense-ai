package com.farmsense.config;

import com.farmsense.model.entity.User;
import com.farmsense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // 1. Update or Create Admin User
        userRepository.findByEmail("admin@farmsense.ai").ifPresentOrElse(admin -> {
            if (!"ROLE_ADMIN".equals(admin.getRole())) {
                admin.setRole("ROLE_ADMIN");
                userRepository.save(admin);
                log.info("✅ Admin account ready (updated role)");
            } else {
                log.info("✅ Admin account ready");
            }
        }, () -> {
            User adminUser = User.builder()
                    .fullName("Admin User")
                    .email("admin@farmsense.ai")
                    .passwordHash(encoder.encode("admin1234"))
                    .emailVerified(true)
                    .role("ROLE_ADMIN")
                    .build();
            userRepository.save(adminUser);
            log.info("✅ Admin account ready (created)");
        });

        // 1.5 Clean up any other admins
        userRepository.findAll().stream()
            .filter(u -> "ROLE_ADMIN".equals(u.getRole()) && !"admin@farmsense.ai".equals(u.getEmail()))
            .forEach(u -> {
                log.info("Deleting old admin account: {}", u.getEmail());
                userRepository.delete(u);
            });

        // 2. Insert Agronomists
        createAgronomistIfNotFound(encoder, "Dr. Rajesh Kumar", "agronomist1@farmsense.com", "Agronomist1!");
        createAgronomistIfNotFound(encoder, "Dr. Priya Sharma", "agronomist2@farmsense.com", "Agronomist2!");
        
        // 2.5 Clean up any other agronomists
        userRepository.findAll().stream()
            .filter(u -> "ROLE_AGRONOMIST".equals(u.getRole()) && 
                         !"agronomist1@farmsense.com".equals(u.getEmail()) && 
                         !"agronomist2@farmsense.com".equals(u.getEmail()))
            .forEach(u -> {
                log.info("Deleting old agronomist account: {}", u.getEmail());
                userRepository.delete(u);
            });
            
        log.info("✅ 2 Agronomist accounts ready");
    }

    private void createAgronomistIfNotFound(BCryptPasswordEncoder encoder, String name, String email, String password) {
        userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    if (!"ROLE_AGRONOMIST".equals(user.getRole())) {
                        user.setRole("ROLE_AGRONOMIST");
                        userRepository.save(user);
                    }
                },
                () -> {
                    User agro = User.builder()
                            .fullName(name)
                            .email(email)
                            .passwordHash(encoder.encode(password))
                            .emailVerified(true)
                            .role("ROLE_AGRONOMIST")
                            .build();
                    userRepository.save(agro);
                }
        );
    }
}
