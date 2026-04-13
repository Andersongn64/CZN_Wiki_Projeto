#!/usr/bin/env node
'use strict';

const path   = require('path');
const fs     = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const recommender = require('../src/services/recommender');

async function withRetries(fn, attempts, verbose) {
  verbose = verbose || false;
  var lastErr = null;
  var i = 1;
  while (i <= attempts) {
    try {
      if (verbose) console.log('Attempt ' + i + '/' + attempts + '...');
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts) {
        var wait = 500 * i;
        if (verbose) console.warn('Error, retrying after ' + wait + 'ms:', err.message || err);
        await new Promise(function(r){ setTimeout(r, wait); });
      }
    }
    i++;
  }
  throw lastErr;
}

async function main() {
  var argv    = process.argv.slice(2);
  var verbose = false;
  var retries = 1;
  var pos     = null;

  for (var i = 0; i < argv.length; i++) {
    var a = argv[i];
    if (a === '--verbose' || a === '-v') { verbose = true; continue; }
    if (a.indexOf('--retries=') === 0) { retries = parseInt(a.split('=')[1]) || 1; continue; }
    if (a === '--retries') {
      var val = argv[i + 1];
      if (val) { retries = parseInt(val) || 1; i++; }
      continue;
    }
    if (!pos) pos = a;
  }

  try {
    if (pos) {
      var abs = path.isAbsolute(pos) ? pos : path.join(process.cwd(), pos);

      if (fs.existsSync(abs)) {
        var stats = fs.statSync(abs);

        if (stats.isDirectory()) {
          if (verbose) console.log('Ingesting directory:', abs);

          var all   = fs.readdirSync(abs);
          var files = [];
          for (var j = 0; j < all.length; j++) {
            var name = all[j];
            var ext  = name.split('.').pop().toLowerCase();
            if (ext === 'md' || ext === 'markdown' || ext === 'csv') {
              files.push(name);
            }
          }

          if (files.length === 0) {
            console.warn('No .md/.markdown/.csv files found in:', abs);
            process.exit(0);
          }

          var total = 0;
          for (var k = 0; k < files.length; k++) {
            var fp  = path.join(abs, files[k]);
            if (verbose) console.log(' - ingesting', fp);
            var out = await withRetries(function(){ return recommender.ingestFromExport(fp); }, retries, verbose);
            total  += out.count || 0;
          }

          console.log('Directory ingest completed. Total docs processed:', total);
          process.exit(0);
        }

        if (verbose) console.log('Ingesting file:', abs);
        var outFile = await withRetries(function(){ return recommender.ingestFromExport(abs); }, retries, verbose);
        console.log('Ingest completed from file:', outFile);
        process.exit(0);
      }
    }

    var db = pos || process.env.NOTION_DATABASE_ID;

    if (!db) {
      console.error('ERROR: Missing databaseId or export file/dir.');
      console.error('Usage: node ingest.js [file|dir|databaseId] [--verbose] [--retries=N]');
      console.error('Or set NOTION_DATABASE_ID in your .env file.');
      process.exit(2);
    }

    if (verbose) console.log('Starting Notion ingest for database:', db);
    var outNotion = await withRetries(function(){ return recommender.ingestNotion(db); }, retries, verbose);
    console.log('Ingest completed:', outNotion);
    process.exit(0);

  } catch (err) {
    console.error('Ingest failed:', err.message || err);
    if (verbose && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();