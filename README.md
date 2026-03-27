# lector
![C++](https://img.shields.io/badge/C++-23-blue?style=flat-square&logo=c%2B%2B)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-10.0-purple?style=flat-square&logo=dotnet)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)

A LAN-based OCR scanning tool built with ASP.NET Core, React, and C++ OpenCV + Tesseract.

[⟹ See screenshots](#-screenshots)

## ✨ Features
- **Image Upload**
  - Drag and drop or select images to upload
- **OCR Scanning** 
  - OpenCV for image preprocessing (cleanup)
  - Tesseract OCR for character recognition
- **Scan History**
  - View, copy or delete previous scans
- **Cross-platform**
  - Running the server on Windows/Linux/macOS enables a client of any OS to use via web interface.

## 💾 Downloads
![Under Construction](https://img.shields.io/badge/Under_Construction-yellow?style=flat-square&color=feb100&labelColor=feb100)

Coming soon for Windows/Linux/macOS

## 🛠️ Installation
### Prerequisites
- .NET 10 SDK
- Node.js 24+
- C++23 compiler (optional)
  - Only for lector-scanner, otherwise download binary

### Clone the repository
```bash
git clone https://github.com/anelkica/lector
cd lector
```
### Backend
```bash
cd Lector.API
dotnet run

# Backend runs on http://localhost:5185
```
Visit `http://localhost:5185/scalar` for OpenAPI Scalar docs
### Frontend
```bash
cd lector-client
npm install
npm run dev

# Frontend runs on http://localhost:5173
```

## 🌱 Architecture
Basic flow:
1. User uploads image and frontend sends to backend
2. If already processed or duplicate, instantly return results
3. If not, save image to images folder and try to scan with C++ CLI
4. If successful, create entry in `scans.db` for use


<img width="615" height="295" alt="Diagram image" src="https://github.com/user-attachments/assets/6847d16b-c277-4819-8c59-e5c0fa4ae49a" />

## 📍 API Endpoints
These are the essential API endpoints for basic usage, however, it's best to visit the project's OpenAPI docs at `http://localhost:5185/scalar` after running the backend.
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/scans` | List recent scans |
| `GET` | `/api/scans/:id` | Get scan details |
| `GET` | `/api/scans/:id/image` | Get scan image |
| `DELETE` | `/api/scans/:id` | Delete a scan |
| `POST` | `/api/scans` | Upload & scan image |
| `GET` | `/health` | Health check |

## 📸 Screenshots
<div align="center">
  <p>Desktop and mobile UI</p>
  <img height="320" alt="Desktop view 1" src="https://github.com/user-attachments/assets/72a5d7bf-b5c0-4214-a758-586ab5dccebd" />
  <img height="320" alt="Desktop view 2" src="https://github.com/user-attachments/assets/bc1cee8b-73fb-44ce-a0dd-4503001f6b59" />
  <img height="320" alt="Mobile view" src="https://github.com/user-attachments/assets/09b430dd-e049-4382-9821-26365df61950" />
</div>

## ⚖️ License
MIT
