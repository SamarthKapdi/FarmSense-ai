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
        long userCount = userRepository.count();

        if (userCount > 0) {
            log.info("ℹ️ Database already has {} users — skipping seed", userCount);
            return;
        }

        log.info("✅ Seeding demo users into empty database...");
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        User demoUser = User.builder()
                .fullName("Demo Farmer")
                .email("demo@farmsense.com")
                .passwordHash(encoder.encode("farm1234"))
                .emailVerified(true)
                .role("FARMER")
                .preferredLanguage("en")
                .preferredCrop("Tomato")
                .build();
        userRepository.save(demoUser);
        log.info("✅ Seeded demo user  →  email: demo@farmsense.com  |  password: farm1234");

        User adminUser = User.builder()
                .fullName("Admin User")
                .email("admin@farmsense.com")
                .passwordHash(encoder.encode("admin1234"))
                .emailVerified(true)
                .role("ADMIN")
                .preferredLanguage("en")
                .preferredCrop("Rice")
                .build();
        userRepository.save(adminUser);
        log.info("✅ Seeded admin user →  email: admin@farmsense.com |  password: admin1234");
    }
}
