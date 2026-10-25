// Shared form handler for the sign-up and contact forms.
(function () {
  function wire(formId, endpoint, success) {
    var form = document.getElementById(formId);
    if (!form) return;
    var status = form.querySelector('.status');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());
      status.className = 'status';
      status.textContent = '';
      if (!form.checkValidity()) {
        status.className = 'status err';
        status.textContent = 'Check the highlighted fields and try again.';
        form.reportValidity();
        return;
      }
      button.disabled = true;
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().catch(function () { return { ok: false, error: 'Unexpected response.' }; })
            .then(function (body) { return { res: res, body: body }; });
        })
        .then(function (out) {
          if (out.res.ok && out.body.ok) {
            status.className = 'status ok';
            status.textContent = success;
            form.reset();
          } else {
            status.className = 'status err';
            status.textContent = out.body.error || 'Something went wrong. Try again.';
          }
        })
        .catch(function () {
          status.className = 'status err';
          status.textContent = 'Network error. Check your connection and try again.';
        })
        .finally(function () { button.disabled = false; });
    });
  }

  wire('signup-form', '/api/signup', 'You are on the list. We will be in touch.');
  wire('contact-form', '/api/contact', 'Thanks. We will reply within two business days.');
})();
