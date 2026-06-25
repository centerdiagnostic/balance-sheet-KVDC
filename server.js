const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// อนุญาตให้ Frontend ยิง API เข้ามาได้ และตั้งลิมิตขนาดไฟล์ (เพราะมี Base64 รูปภาพ)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.post('/api/export-pdf', async (req, res) => {
    const { htmlContent } = req.body;

    if (!htmlContent) {
        return res.status(400).send('Missing HTML content');
    }

    let browser;
    try {
        // ตั้งค่า args พิเศษสำหรับรันบน Render.com
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // กำหนดเนื้อหา HTML ให้ Puppeteer
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // สร้าง PDF เป็นแบบแนวนอน (Landscape) ขนาด A4
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });

        await browser.close();

        // ส่งไฟล์ PDF กลับไปยัง Frontend
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="Dashboard_Report.pdf"',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        if (browser) await browser.close();
        res.status(500).send('Error generating PDF');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});