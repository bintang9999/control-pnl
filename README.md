Fitur Utama
Pemantauan CPU, RAM, jaringan, dan sistem secara real-time
Manajemen Docker dan Docker Compose
Terminal SSH berbasis web yang aman
File Manager dengan akses terbatas (Safe Mode)
Manajemen layanan OpenRC
Integrasi Tailscale
Autentikasi berbasis JWT dan bcrypt
Audit log untuk aktivitas penting
Backup otomatis
Prasyarat
Alpine Linux atau postmarketOS
Node.js 18+
Docker & Docker Compose
Build tools untuk node-pty
Menjalankan Proyek
npm run install:all
npm run dev

Akses panel melalui:

http://localhost:5173

Login bawaan:

admin / admin
Keamanan

Dirancang untuk penggunaan pada jaringan privat dan sangat disarankan diakses melalui VPN seperti Tailscale. Jangan mengekspos panel langsung ke internet tanpa HTTPS, reverse proxy yang aman, dan autentikasi yang kuat.
