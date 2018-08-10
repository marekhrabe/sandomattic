#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const CheckboxPrompt = require('prompt-checkbox');
const CONFIG_PREFIX = '# wpcom sandbox: ';
const HOSTS_FILE = process.env.HOSTS_FILE || '/etc/hosts';

fs.readFile(HOSTS_FILE, 'utf8', (err, data) => {
  if (err) throw err;

  const lines = data.split('\n');
  const hosts = [];
  let sanbdoxIP = null;

  lines.forEach((line, i) => {
    if (line.startsWith(CONFIG_PREFIX)) {
      sanbdoxIP = line.replace(CONFIG_PREFIX, '').trim();
    } else {
      let parsedLine = line.trim().split(/\s+/);
      const isDisabled = parsedLine[0] === '#';
      const ip = parsedLine[isDisabled ? 1 : 0];
      const host = parsedLine[isDisabled ? 2 : 1];
      if (ip && host) {
        hosts.push({
          index: i,
          ip: ip,
          host: host,
          disabled: isDisabled,
        });
      }
    }
  });

  if (!sanbdoxIP) {
    console.log('No config found. This might be your first run of this utility.');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return rl.question('What is your Sandbox IP address? ', (ip) => {
      rl.close();
      if (ip.length > 0) {
        writeHosts([CONFIG_PREFIX + ip].concat(lines));
      } else {
        console.log('No IP provided.');
      }
    });
  } else {
    console.log('Your Sandbox is ' + sanbdoxIP);
  }

  const sandboxedHosts = hosts.filter((host) => host.ip === sanbdoxIP);

  if (sandboxedHosts.length === 0) {
    console.log('No sites sandboxed.');
    return;
  }

  new CheckboxPrompt({
    name: 'sites',
    message: 'What to sandbox?',
    choices: sandboxedHosts.map((host) => host.host),
    default: sandboxedHosts.filter((host) => !host.disabled).map((host) => host.host),
  }).ask((active) => {
    if (active.length === 0) {
      console.log('Nothing');
    }
    const newLines = lines.slice();
    sandboxedHosts.forEach((host) => {
      if (host.disabled && active.indexOf(host.host) > -1) {
        lines[host.index] = lines[host.index].replace(/^# /g, '');
      } else if (!host.disabled && active.indexOf(host.host) === -1) {
        lines[host.index] = '# ' + lines[host.index];
      }
    });
    writeHosts(lines);
  });
});

const writeHosts = (lines) => {
  fs.writeFile(HOSTS_FILE, lines.join('\n'), 'utf8', (err) => {
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
