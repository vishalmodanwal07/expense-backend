import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ✅ Uploads folder 
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // ✅ absolute path
  },
  filename: (req, file, cb) => {
    const uniqueName = `receipt_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});


export const upload = multer({ storage });

export const scanReceipt = async (req, res) => {
  console.log("File received:", req.file); 
  console.log("Body:", req.body);           
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    
    const receiptUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      receiptUrl
    });

  } catch (err) {
    console.error("Receipt scan error:", err.message);
    return res.status(500).json({ message: "Receipt scan failed", error: err.message });
  }
};