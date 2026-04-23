document.querySelector('[data-test-btn]')?.addEventListener('click', async () => {
   try {
      const response = await fetch('http://tg-avatar-validate.frontelf.com/predict/image', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'sk_9f3c8a1e7b4d2c6f5a0e8d1c7b9a4f6e2c8d5a1b7e3f9',
         },
         body: JSON.stringify({
            input: {
               type: 'url',
               data: 'https://cdni.pornpics.com/460/7/789/10420038/10420038_192_de00.jpg',
            },
         }),
      })

      const text = await response.text()
      console.log('STATUS:', response.status)
      console.log('BODY:', text)
   } catch (err) {
      console.error('Request failed:', err)
   }
})