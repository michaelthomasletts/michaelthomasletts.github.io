---
title: "Contact"
type: "contact"
outputs: ["HTML"]
build:
  list: never
  render: always
---

<form action="https://formspree.io/f/mdklypwz" method="POST">
  <label>Your email<br>
    <input type="email" name="email" required>
  </label><br><br>

  <label>Message<br>
    <textarea name="message" rows="6" required></textarea>
  </label>

  <input type="text" name="_gotcha" style="display:none">

  <button type="submit">Send</button>
</form>
