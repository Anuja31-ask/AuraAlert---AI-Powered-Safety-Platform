/* =========================================
   AuraAlert – Auth Utilities
   ========================================= */

// Form validation helpers
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[\+]?[0-9]{10,13}$/.test(phone.replace(/\s/g, ''));
}

// Prevent form resubmit on back
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}
