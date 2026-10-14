/* Bootstrap handles the menu, carousel, tabs, modals and accordion.
   This script only validates the demonstration enquiry. */
const enquiryForm = document.querySelector('#enquiryForm');
if (enquiryForm) {
  const feedback = document.querySelector('#formFeedback');
  enquiryForm.addEventListener('input', () => {
    feedback.textContent = '';
    feedback.className = 'mt-3';
  });
  enquiryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!enquiryForm.reportValidity()) return;
    feedback.className = 'alert alert-success mt-3';
    feedback.textContent = 'Your demo enquiry is valid. Nothing has been sent or saved.';
  });
}
