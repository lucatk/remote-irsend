const express = require('express');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const shellEscape = require('shell-escape');

const app = express();

const PORT = 3000;
const BASE_CMD = ['irsend', '-d', '/dev/lirc0'];

app.use((req, _, next) => {
  const query = Object.entries(req.query).map(([key, value]) => `${key}=${value}`).join('&');
  console.log(`< ${req.originalUrl.split("?").shift()}: ${query}`);
  next();
});

app.post('/send', async (req, res) => {
  const { remote, cmd, duration } = req.query;
  const args = [remote, cmd];
  let command;
  if (duration && duration > 0) {
    command = [
      [...BASE_CMD, 'SEND_START', ...args],
      ['sleep', duration],
      [...BASE_CMD, 'SEND_STOP', ...args],
    ];
  } else {
    command = [[...BASE_CMD, 'SEND_ONCE', ...args]];
  }
  try {
    const result = await exec(command.map(shellEscape).join(' && '));
    return res.status(200).json(result).end();
  } catch (err) {
    return res.status(500).json(err).end();
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}...`));
