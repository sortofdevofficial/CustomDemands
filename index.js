// Cleaned-up JavaScript. 
// Firebase logic removed since you are using Google Forms.

console.log("Sticker store loaded successfully.");

// Accordion (Kept in case you add FAQs later)
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  q.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});