function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      studentFirstName: form.querySelector('[name="studentFirstName"]').value.trim(),
      studentLastName: form.querySelector('[name="studentLastName"]').value.trim(),
      parent_firstName: form.querySelector('[name="parent_firstName"]').value.trim(),
      parent_Lastname: form.querySelector('[name="parent_Lastname"]').value.trim(),
      relationship: form.querySelector('[name="relationship"]').value.trim(),
      phone: form.querySelector('[name="phone"]').value.trim(),
      address: form.querySelector('[name="address"]').value.trim(),
      email: form.querySelector('[name="email"]').value.trim(),
      age: form.querySelector('[name="age"]').value.trim(),
      grade: form.querySelector('[name="grade"]').value.trim(),
      previous_school: form.querySelector('[name="previous_school"]').value.trim(),
      reason: form.querySelector('[name="reason"]').value.trim(),
      hear_about: form.querySelector('[name="hear_about"]').value.trim(),
      additional_info: form.querySelector('[name="additional_info"]').value.trim()
    };

    let errEl = document.getElementById('form-errors');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'form-errors';
      form.prepend(errEl);
    }

    try {
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const response = await fetch("http://localhost:5000/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      errEl.textContent = "✅ Enrollment successful!";
      form.reset();

    } catch (error) {
      console.error(error);
      errEl.textContent = "❌ Submission failed. Check server.";
    } finally {
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}