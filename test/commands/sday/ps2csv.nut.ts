import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

describe('sday ps2csv NUTs', () => {
  let session: TestSession;

  before(async () => {
    // testsession project dir
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
  });

  after(async () => {
    await session?.clean();
  });

  it('should display object permissions', () => {

    const command = 'sday ps2csv -p PS1 -r objectPermissions --projectdir ./test/testproject -c object';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output).to.contain('Account');
  });

  it('should warn (not error) when the requested permission type is absent', () => {
    // PSNoObj has only userPermissions; asking for objectPermissions should not crash.
    const command = 'sday ps2csv -p PSNoObj -r objectPermissions --projectdir ./test/testproject';
    const result = execCmd(command, { ensureExitCode: 0 });
    expect(result.shellOutput.stderr).to.contain('No objectPermissions found');
  });

});
