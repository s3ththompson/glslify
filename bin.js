#!/usr/bin/env node

const glslifyBundle = require('glslify-bundle')
const glslifyDeps   = require('glslify-deps')
const glslResolve   = require('glsl-resolve')
const minimist      = require('minimist')
const path          = require('path')
const bl            = require('bl')
const fs            = require('fs')

const INPUT  = path.join(__dirname, '__bogus__')
const argv   = minimist(process.argv.slice(2))
const depper = glslifyDeps({ readFile: readFile })

var input = ''

if (argv.help) return help()
if (!argv._.length && process.stdin.isTTY) return help()

argv.t = argv.t || []
argv.t = Array.isArray(argv.t) ? argv.t : [argv.t]
argv.t.forEach(function(tr) {
  depper.transform(tr)
})

//
// Build dependency tree, then output
//
if (argv._.length) {
  return depper.add(argv._[0], output)
}

process.stdin.resume()
process.stdin.pipe(bl(function(err, src) {
  if (err) throw err

  input = src
  depper.add(INPUT, output)
}))

//
// Logs --help information out to stderr.
//
function help() {
  fs.createReadStream(path.join(__dirname, 'usage.txt'))
    .once('close', function() { console.error() })
    .pipe(process.stderr)
}

//
// Wrapper function for accepting a file
// on stdin
//
function readFile(filename, done) {
  if (filename === INPUT) return done(null, input)
  fs.readFile(filename, 'utf8', done)
}

//
// Shared function for outputting either to
// stdout or a file
//
function output(err, tree) {
  if (err) throw err
  var src = glslifyBundle(tree)
  if (!argv.output) return process.stdout.write(src)
  fs.writeFile(argv.output, src)
}
