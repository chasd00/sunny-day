import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import SdayXlf2csv from '../../../src/commands/sday/xlf2csv.js';

describe('sday xlf2csv', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('runs xlf2csv with a valid file', async () => {
    const filename = fileURLToPath(import.meta.url);
    const dir = dirname(filename);
    const filePath = join(dir, '../../testproject/translations/en_US.xlf');
    await SdayXlf2csv.run(['--file', filePath]);

    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');

    expect(output).to.include('id,maxwidth,size-unit,source-language,source,target-language,target,note');
    expect(output).to.include('greeting,20,char,en_US,Hello World,es,Hola Mundo,A simple greeting');
    expect(output).to.include('farewell,,,en_US,Goodbye,es,Adiós,');
  });

  it('throws error if file does not exist', async () => {
    try {
      await SdayXlf2csv.run(['--file', 'nonexistent.xlf']);
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });
});
