// controllers/authController.js

// Hard-coded admin credentials
const ADMIN_EMAIL = 'abigail@gadesfit.com';
const ADMIN_PASSWORD = 'GadesFit2024!';

exports.getLogin = (req, res) => {
  // Redirect if already logged in
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  
  res.render('admin/login', {
    title: 'Admin Login - GaDes fit',
    error: null
  });
};

exports.postLogin = (req, res) => {
  const { email, password } = req.body;
  
  // Debug logging
  console.log('=== LOGIN ATTEMPT ===');
  console.log('Email:', email);
  console.log('Password:', password ? '******' : 'empty');
  console.log('Expected:', ADMIN_EMAIL);
  console.log('Match:', email === ADMIN_EMAIL && password === ADMIN_PASSWORD);
  
  // Check credentials
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.adminEmail = email;
    console.log('✅ Login successful');
    return res.redirect('/admin/dashboard');
  }
  
  console.log('❌ Login failed');
  res.render('admin/login', {
    title: 'Admin Login - GaDes fit',
    error: 'Invalid email or password'
  });
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/admin/login');
  });
};