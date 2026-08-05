import chalk from 'chalk'

function drawCoffee() {
   const coffeeArt = `
${chalk.gray('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀')}
${chalk.gray('⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠤⠒⠉⠉⠉⣀⣂⣅⠬⡉⠭⢛⠿⢟⡶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀')}
${chalk.gray('⠀⠀⠀⠀⠀⠀⠀⣠⠞⠁⠀⣄⢎⢩⢸⢉⣵⡖⢰')}${chalk.hex('#8B4513')('⣶⣮')}${chalk.gray('⢹')}${chalk.hex('#8B4513')('⣦')}${chalk.gray('⣡⢊⢻⡿⣦⠀⠀⠀⠀⠀⠀⠀')}
${chalk.gray('⠀⠀⠀⠀⠀⠀⢠⡇⠀⠀⢎⠕⢭⢪⡶⠈')}${chalk.hex('#8B4513')('⢿⣷⣿⠟')}${chalk.gray('⣋⣚⣯⣒⣣⡑⢨⢻⡇⠀⣀⣀⠀⠀⠀')}
${chalk.gray('⠀⠀⠀⠀⠀⣀⡼⣧⠀⠄⡊⢼⡩')}${chalk.hex('#8B4513')('⣾')}${chalk.gray('⢌⠳⡜')}${chalk.hex('#8B4513')('⣉⡠⡜⡞⣵')}${chalk.gray('⣊⡧⡠⠝⣣⾾⠁⠀⠻⠿⠗⠀⠀')}
${chalk.gray('⠀⠀⠀⣢')}${chalk.hex('#8B4513')('⣾⡟')}${chalk.gray('⣥⠻')}${chalk.hex('#8B4513')('⣷')}${chalk.gray('⣌⡀⠬⡘⢅')}${chalk.hex('#8B4513')('⡟⡇⡮⣷⡾⡿')}${chalk.gray('⢋⣉⢣⢔⣎⠿⠊⠀⠀⡴⣛⠆⠌⠀⠀')}
${chalk.gray('⠀⢀')}${chalk.hex('#8B4513')('⣶⡟')}${chalk.gray('⣡')}${chalk.hex('#8B4513')('⣿⣿⣟⢯⣟⢿⣷⣶⣯⣬⣵⣾⣷⣶⡾')}${chalk.gray('⠧⠞⠓⠉⠀⠀⠀⢀⠘⠈⠀⠠⢘⡤⠀')}
${chalk.gray('⠄')}${chalk.hex('#8B4513')('⣾⠏')}${chalk.gray('⣐⣛⡻')}${chalk.hex('#8B4513')('⢿⣿⣯⣿⣿⣿⣾⣽⣛')}${chalk.gray('⣍⢃⡂⢄⠀⡀⠀⡀⠄⢂⠄⠡⢈⠒⡈⢒⠘⠴⢀⠀')}
${chalk.gray('⢰')}${chalk.hex('#8B4513')('⣿')}${chalk.gray('⠀⠈⠻⣜⣄⠈⢙')}${chalk.hex('#8B4513')('⣾⢿⣿⣿⣿⡿')}${chalk.gray('⣜⢣⡜⢢⠁⠄⡐⢠⢉⠂⠌⠀⡀⠄⠐⡀⠄⠐⠀⢐')}
${chalk.gray('⠸')}${chalk.hex('#8B4513')('⣟')}${chalk.gray('⠀⡐⡅⠈⠑⠀⠊⠝⠈⢖')}${chalk.hex('#8B4513')('⡿⠿⣿⣾')}${chalk.gray('⡱⢊⠅⡌⡰⢌⢆⠣⠈⢀⠐⠀⠄⠂⠠⡈⠠⣈⡧')}
${chalk.gray('⠀⢿⣆⠱⣘')}${chalk.hex('#8B4513')('⣧⣤')}${chalk.gray('⣀⣀⡀⢒⡥⣑⢨⠒⡰⠯⠾⡼⠶⠙⢈⠀⣀⠂⡄⢂⣁⢢')}${chalk.hex('#8B4513')('⣑⣶⡽⣳')}${chalk.gray('⠟⠁')}
${chalk.gray('⠀⠀⠻')}${chalk.hex('#8B4513')('⣧⡜⢹⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦')}${chalk.gray('⣴⡀⡀⠀⠛⠺')}${chalk.hex('#8B4513')('⢿⣶⣿⣾⣷⣿⣿⣿⢟⣵')}${chalk.gray('⠏⠀⠀')}
${chalk.gray('⠀⠀⠀⠈⠿')}${chalk.hex('#8B4513')('⣶')}${chalk.gray('⣉⠻')}${chalk.hex('#8B4513')('⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷')}${chalk.gray('⣧⣤⢀⠀⠀⠈⠉⠙⠻')}${chalk.hex('#8B4513')('⣯⡷')}${chalk.gray('⠟⠁⠀⠀⠀')}
${chalk.gray('⠀⠀⠀⠀⠀⠈⠙⠿')}${chalk.hex('#8B4513')('⣶⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿')}${chalk.gray('⣾⣞⣤⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀')}
${chalk.gray('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠛⠛⠿⠿⠿⠿⠿⠿⠛⠛⠛⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀')}
    `
   console.log(coffeeArt)
}

drawCoffee()