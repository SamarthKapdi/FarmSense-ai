package com.farmsense;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FarmSenseApplication {
    public static void main(String[] args) {
        SpringApplication.run(FarmSenseApplication.class, args);
    }
}
