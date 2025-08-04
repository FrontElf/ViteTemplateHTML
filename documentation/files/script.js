// document.querySelectorAll(".copy").forEach(button => {
//    button.addEventListener("click", function () {
//       // Знаходимо батьківський елемент з класом code-block
//       const codeBlock = this.closest(".code-block")

//       // Знаходимо елемент <code> всередині code-block
//       const codeElement = codeBlock.querySelector("code")

//       // Створюємо тимчасове текстове поле для копіювання
//       const tempTextArea = document.createElement("textarea")
//       tempTextArea.value = codeElement.innerText
//       document.body.appendChild(tempTextArea)

//       // Виділяємо і копіюємо текст
//       tempTextArea.select()
//       document.execCommand("copy")

//       // Видаляємо тимчасове поле
//       document.body.removeChild(tempTextArea)

//       // Повідомляємо користувача про успішне копіювання
//       alert("Текст скопійовано в буфер обміну!")
//    })
// })