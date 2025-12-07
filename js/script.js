// Animate Skill Bars
window.onload = function() {
  document.querySelectorAll(".skillbar div").forEach(bar => {
    let width = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => bar.style.width = width, 300);
  });
};

// Highlight current page in navbar
let page = window.location.pathname.split("/").pop();
document.querySelectorAll(".w3-bar a").forEach(a => {
  if(a.getAttribute("href") === page) a.classList.add("active");
});

// Dark/Light Mode Toggle (optional)
function toggleTheme() {
  document.body.classList.toggle("w3-light-grey");
  document.body.classList.toggle("w3-black");
}
