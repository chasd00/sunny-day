import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

describe('sday psg2csv NUTs', () => {
  let session: TestSession;

  before(async () => {
    // testsession project dir
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
  });

  after(async () => {
    await session?.clean();
  });

  it('should display object permissions', () => {

    const command = 'sday psg2csv -p PSG1 -r objectPermissions --projectdir ./test/testproject';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output).to.contain('Account');
  });

  it('should mute object permissions disabled by the muting permission set', () => {
    // PS1/PS2 grant Delete on Account; PSG1_Muted mutes Delete (and ModifyAll). Read stays granted.
    const command = 'sday psg2csv -p PSG1 -r objectPermissions --projectdir ./test/testproject';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    // header: Name,allowCreate,allowDelete,allowEdit,allowRead,modifyAllRecords,viewAllFields,viewAllRecords,PSG
    const accountRow = output.split('\n').find((line) => line.startsWith('Account,'));
    expect(accountRow, 'Account row should exist').to.be.a('string');
    expect(accountRow).to.equal('Account,TRUE,FALSE,TRUE,TRUE,FALSE,FALSE,FALSE,PSG1');
    // Contact is not muted, so Delete remains granted.
    expect(output).to.contain('Contact,TRUE,TRUE,TRUE,TRUE,FALSE,FALSE,FALSE,PSG1');
  });

  it('should mute user permissions disabled by the muting permission set', () => {
    // PS2 grants ViewSetup; PSG1_Muted mutes it. ActivitiesAccess (PS1) is untouched.
    const command = 'sday psg2csv -p PSG1 -r userPermissions --projectdir ./test/testproject';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output).to.contain('ActivitiesAccess,TRUE,PSG1');
    expect(output).to.contain('ViewSetup,FALSE,PSG1');
  });

});
