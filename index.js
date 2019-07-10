#!/usr/bin/env node

const fs = require('fs');
const CheckboxPrompt = require('prompt-checkbox');
const CONFIG_PREFIX = '# wpcom sandbox: ';
const HOSTS_FILE = process.env.HOSTS_FILE || '/etc/hosts';
const argv = process.argv;
const { ask, writeHosts } = require('./utils');

fs.readFile(HOSTS_FILE, 'utf8', async (err, data) => {
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
      const host = parsedLine.slice(isDisabled ? 2 : 1);
      if (ip && host) {
        hosts.push({
          index: i,
          ip: ip,
          host: host.join(' '),
          disabled: isDisabled,
        });
      }
    }
  });

  if (!sanbdoxIP) {
    console.log('No config found. This might be your first run of this utility.');

    const ip = await ask('What is your Sandbox IP address?');
    if (ip.length > 0) {
      lines.push(CONFIG_PREFIX + ip);
      sanbdoxIP = ip;
    } else {
      console.log('No IP provided.');
      return;
    }
  }

  console.log('Your Sandbox is ' + sanbdoxIP);

  const sandboxedHosts = hosts.filter((host) => host.ip === sanbdoxIP);

  if (sandboxedHosts.length === 0) {
    console.log('No sites sandboxed.');
  }

  if ( sandboxedHosts.length === 0 || argv.indexOf('add') > -1) {
    const host = await ask('Add domain for sandboxing:')
    if (host) {
      const index = lines.push( sanbdoxIP + ' ' + host );
      const entry = {
        index,
        host,
        ip: sanbdoxIP,
      };
      hosts.push(entry);
      sandboxedHosts.push(entry);
      console.log('🆗');
    } else {
      console.log('Nothing added.');
    }
  }

  console.log('');
  new CheckboxPrompt({
    name: 'sites',
    message: 'What to sandbox?',
    choices: sandboxedHosts.map((host) => host.host),
    default: sandboxedHosts.filter((host) => !host.disabled).map((host) => host.host),
  }).ask((active) => {
    if (active.length === 0) {
      console.log('Nothing');
    }
    sandboxedHosts.forEach((host) => {
      if (host.disabled && active.indexOf(host.host) > -1) {
        lines[host.index] = lines[host.index].replace(/^# /g, '');
      } else if (!host.disabled && active.indexOf(host.host) === -1) {
        lines[host.index] = '# ' + lines[host.index];
      }
    });
    writeHosts(HOSTS_FILE, lines);
  });
});
