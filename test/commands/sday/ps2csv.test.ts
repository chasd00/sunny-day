import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import SdayPs2csv from '../../../src/commands/sday/ps2csv.js';

describe('sday ps2csv', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('runs ps2csv for userPermissions', async () => {
    await SdayPs2csv.run(['-d', './test/testproject', '-p', 'ps1', '-r', 'userPermissions', '-c', 'name']);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include('name,enabled');
  });

});
