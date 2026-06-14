document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('mock-report-modal');
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const dropdowns = document.querySelectorAll('.mock-comment-dropdown');

  // Dropdown opening toggles
  document.querySelectorAll('.mock-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = btn.nextElementSibling;
      const isShowing = dropdown.style.display === 'block';
      dropdowns.forEach(d => d.style.display = 'none');
      dropdown.style.display = isShowing ? 'none' : 'block';
    });
  });

  // Close dropdowns on body clicks
  document.addEventListener('click', () => {
    dropdowns.forEach(d => d.style.display = 'none');
  });

  // Clicking report trigger inside the comment context menu
  document.querySelectorAll('.report-trigger').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdowns.forEach(d => d.style.display = 'none');
      // Reset modal screens
      step1.style.display = 'block';
      step2.style.display = 'none';
      modal.style.display = 'flex';
    });
  });

  // Modal buttons
  document.getElementById('btn-cancel-report').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('btn-next-step').addEventListener('click', () => {
    step1.style.display = 'none';
    step2.style.display = 'block';
  });

  document.getElementById('btn-back-step').addEventListener('click', () => {
    step1.style.display = 'block';
    step2.style.display = 'none';
  });

  document.getElementById('btn-submit-report').addEventListener('click', () => {
    alert('Thank you! Report submitted successfully.');
    modal.style.display = 'none';
  });
});
