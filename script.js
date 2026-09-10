const sections = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {

    entries.forEach((entry) => {

      if (entry.isIntersecting) {

        entry.target.classList.add("active");

      }

    });

  },
  {
    threshold: 0.15,
  }
);

sections.forEach((section) => {

  revealObserver.observe(section);

});
