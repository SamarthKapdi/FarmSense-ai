package com.farmsense;

import com.farmsense.model.entity.DetectionReport;
import com.farmsense.repository.ReportRepository;
import com.farmsense.service.PdfReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class PdfReportServiceTest {

    @Autowired
    private PdfReportService pdfReportService;

    @Test
    void testPdfGeneration() {
        DetectionReport report = DetectionReport.builder()
                .farmerId("test-farmer-123")
                .cropName("Tomato")
                .diseaseName("Early Blight")
                .confidence(95)
                .severity("HIGH")
                .yieldLossEstimate("15-20%")
                .organicTreatment("Use neem oil")
                .chemicalTreatment("Fungicide XYZ")
                .preventiveMeasures("Crop rotation")
                .bestTimeToTreat("Early morning")
                .createdAt(LocalDateTime.now())
                .build();

        byte[] pdfBytes = pdfReportService.generateReport(report);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0); // valid PDF generated
        
        // Basic check for PDF magic number %PDF
        assertTrue(pdfBytes[0] == 0x25 && pdfBytes[1] == 0x50 && pdfBytes[2] == 0x44 && pdfBytes[3] == 0x46);
    }
}
