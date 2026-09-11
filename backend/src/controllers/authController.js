const USERS = [
  {
    id: 'usr-staff-001',
    username: 'staff.jkn',
    email: 'staff.jkn@bpjs-kesehatan.go.id',
    password: 'jkn',
    name: 'Ahmad Fauzi, S.E.',
    role: 'staff_jkn',
    roleLabel: 'Staff JKN',
    title: 'Staff Verifikator & Triage Klaim BPJS',
    unit: 'Kantor Cabang Utama / Bidang Penjaminan Manfaat',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    capabilities: [
      'Melihat Dashboard Global & Metrik Finansial',
      'Melihat Investigation Queue Seluruh Faskes',
      'Melihat Risk Signal & Disparitas Awal',
      'Membuka & Memverifikasi Berkas Klaim',
      'Mengarahkan & Menugaskan Kasus ke Tenaga Kesehatan'
    ]
  },
  {
    id: 'usr-clinician-001',
    username: 'dr.anindya',
    email: 'dr.anindya@klinik.ac.id',
    password: 'nakes',
    name: 'dr. Anindya Kusuma, Sp.PK',
    role: 'clinical_reviewer',
    roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
    title: 'Dokter Verifikator Klinis / Spesialis Patologi',
    unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    capabilities: [
      'Membuka Kasus yang Ditugaskan',
      'Memeriksa Item Klaim & Kode Tindakan Medis',
      'Menelusuri Rantai Bukti (Evidence Chain)',
      'Menganalisis Evidence Gap & Disparitas Tarif',
      'Memberikan Keputusan Akhir (Review Outcome)',
      'Menambahkan Catatan Rekomendasi Klinis'
    ]
  },
  {
    id: 'usr-clinician-002',
    username: 'dr.budi',
    email: 'dr.budi@klinik.ac.id',
    password: 'nakes',
    name: 'dr. Budi Santoso, Sp.A',
    role: 'clinical_reviewer',
    roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
    title: 'Dokter Verifikator Klinis / Spesialis Anak',
    unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    capabilities: [
      'Membuka Kasus yang Ditugaskan',
      'Memeriksa Item Klaim & Kode Tindakan Medis',
      'Menelusuri Rantai Bukti (Evidence Chain)',
      'Menganalisis Evidence Gap & Disparitas Tarif',
      'Memberikan Keputusan Akhir (Review Outcome)',
      'Menambahkan Catatan Rekomendasi Klinis'
    ]
  },
  {
    id: 'usr-clinician-003',
    username: 'dr.ratna',
    email: 'dr.ratna@klinik.ac.id',
    password: 'nakes',
    name: 'dr. Ratna Dewi, Sp.PD',
    role: 'clinical_reviewer',
    roleLabel: 'Tenaga Kesehatan (Clinical Reviewer)',
    title: 'Dokter Verifikator Klinis / Spesialis Penyakit Dalam',
    unit: 'Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
    avatar: 'https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80',
    capabilities: [
      'Membuka Kasus yang Ditugaskan',
      'Memeriksa Item Klaim & Kode Tindakan Medis',
      'Menelusuri Rantai Bukti (Evidence Chain)',
      'Menganalisis Evidence Gap & Disparitas Tarif',
      'Memberikan Keputusan Akhir (Review Outcome)',
      'Menambahkan Catatan Rekomendasi Klinis'
    ]
  }
];

export async function login(req, res, next) {
  try {
    const { username, password, role } = req.body;

    // If role is explicitly provided via quick button
    if (role) {
      const user = USERS.find(u => u.role === role);
      if (user) {
        return res.status(200).json({
          success: true,
          message: `Login berhasil sebagai ${user.roleLabel}`,
          data: {
            token: `mock-jwt-${user.role}-${Date.now()}`,
            user
          }
        });
      }
    }

    // Check credentials by username or email
    const trimmedInput = (username || '').trim().toLowerCase();
    const user = USERS.find(u => 
      u.username.toLowerCase() === trimmedInput || 
      u.email.toLowerCase() === trimmedInput
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan. Silakan gunakan kredensial demo atau tombol peran cepat.'
      });
    }

    // Check password if given
    if (password && password.trim() !== user.password && password.trim() !== 'admin' && password.trim() !== '123456') {
      return res.status(401).json({
        success: false,
        message: `Password tidak cocok untuk ${user.name}. Gunakan password demo.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Login berhasil sebagai ${user.roleLabel}`,
      data: {
        token: `mock-jwt-${user.role}-${Date.now()}`,
        user
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getRolesInfo(req, res, next) {
  try {
    const rolesInfo = USERS.map(({ password, ...u }) => u);
    res.status(200).json({
      success: true,
      data: rolesInfo
    });
  } catch (err) {
    next(err);
  }
}
