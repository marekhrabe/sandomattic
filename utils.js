const readline = require('readline');
const fs = require('fs');

module.exports.ask = (question) => {
    console.log('');
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question + ' ', (str) => {
            rl.close();
            resolve(str);
        });
    });
};

module.exports.writeHosts = (file, lines) => {
    fs.writeFile(file, lines.join('\n'), 'utf8', (err) => {
        if (err) {
            if (err.code === 'EACCES') {
                console.log('This needs to be run with sudo to write /etc/hosts');
                console.log('❌');
                return process.exit(1);
            } else {
                throw err;
            }
        }

        console.log('✅');
    });
};
