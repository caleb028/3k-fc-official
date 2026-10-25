import { describe, it, expect } from 'vitest';
import { parseFlashscoreStandingsFeed, resolveClubMapping } from '../src/lib/flashscore';

describe('Flashscore Standings Feed Ingestion', () => {
  const sampleFeed = `
~TR÷1¬TU÷q1¬TUC÷004682¬TN÷Gor Mahia¬TI÷GU9jbyMo¬TIU÷/team/mahia/GU9jbyMo/¬TM÷3¬TW÷3¬TWR÷3¬TWO÷0¬TWP÷0¬TWA÷0¬TDR÷0¬TL÷0¬TLR÷0¬TLO÷0¬TLP÷0¬TLA÷0¬TAP÷300.00¬NRM÷0¬LK÷0¬TPK÷3.00¬TPF÷4¬TG÷6:2¬TP÷9¬~LMS÷¬LMU÷w¬LME÷IVM9Zj2t¬~LMS÷¬LMU÷w¬LME÷fuUhH9nC¬~LMS÷¬LMU÷w¬LME÷Ctj6NcMi¬~TR÷10¬TN÷3K FC¬TI÷8reiOTYF¬TIU÷/team/3k-fc/8reiOTYF/¬TM÷2¬TW÷0¬TWR÷0¬TWO÷0¬TWP÷0¬TWA÷0¬TDR÷2¬TL÷0¬TLR÷0¬TLO÷0¬TLP÷0¬TLA÷0¬TAP÷0.00¬NRM÷0¬LK÷0¬TPK÷1.00¬TPF÷0¬TG÷3:3¬TP÷2¬~LMS÷¬LMU÷d¬LME÷123¬~LMS÷¬LMU÷d¬LME÷456¬~TR÷18¬TU÷r1¬TUC÷BD0000¬TN÷Mombasa United¬TI÷8dpoZukn¬TIU÷/team/mombasa-united/8dpoZukn/¬TM÷2¬TW÷0¬TWR÷0¬TWO÷0¬TWP÷0¬TWA÷0¬TDR÷0¬TL÷2¬TLR÷2¬TLO÷0¬TLP÷0¬TLA÷0¬TAP÷33.33¬NRM÷0¬LK÷0¬TPK÷0.00¬TPF÷-2¬TG÷1:3¬TP÷0¬~LMS÷¬LMU÷l¬LME÷789¬~LMS÷¬LMU÷l¬LME÷101
  `.trim();

  it('correctly parses Flashscore standings protocol into structured rows', () => {
    const rows = parseFlashscoreStandingsFeed(sampleFeed);
    expect(rows).toHaveLength(3);

    // Gor Mahia
    expect(rows[0].rank).toBe(1);
    expect(rows[0].teamName).toBe('Gor Mahia');
    expect(rows[0].played).toBe(3);
    expect(rows[0].won).toBe(3);
    expect(rows[0].drawn).toBe(0);
    expect(rows[0].lost).toBe(0);
    expect(rows[0].goalsFor).toBe(6);
    expect(rows[0].goalsAgainst).toBe(2);
    expect(rows[0].goalDifference).toBe(4);
    expect(rows[0].points).toBe(9);
    expect(rows[0].form).toBe('W,W,W');
    expect(rows[0].qualificationNote).toContain('CAF Champions League');

    // 3K FC
    expect(rows[1].rank).toBe(10);
    expect(rows[1].teamName).toBe('3K FC');
    expect(rows[1].played).toBe(2);
    expect(rows[1].won).toBe(0);
    expect(rows[1].drawn).toBe(2);
    expect(rows[1].lost).toBe(0);
    expect(rows[1].goalsFor).toBe(3);
    expect(rows[1].goalsAgainst).toBe(3);
    expect(rows[1].goalDifference).toBe(0);
    expect(rows[1].points).toBe(2);
    expect(rows[1].form).toBe('D,D');

    // Mombasa United
    expect(rows[2].rank).toBe(18);
    expect(rows[2].teamName).toBe('Mombasa United');
    expect(rows[2].qualificationNote).toContain('Relegation - Super League');
    expect(rows[2].form).toBe('L,L');
  });

  it('resolves club mapping accurately for all KPL clubs', () => {
    expect(resolveClubMapping('3K FC').slug).toBe('3k-fc-embu');
    expect(resolveClubMapping('3K FC').is3k).toBe(true);
    expect(resolveClubMapping('Gor Mahia').slug).toBe('gor-mahia-fc');
    expect(resolveClubMapping('Mara Sugar').slug).toBe('mara-sugar-fc');
    expect(resolveClubMapping('Leopards').slug).toBe('afc-leopards-sc');
    expect(resolveClubMapping('Muranga').slug).toBe('muranga-seal-fc');
    expect(resolveClubMapping('Tusker').slug).toBe('tusker-fc');
    expect(resolveClubMapping('Mathare Utd.').slug).toBe('mathare-united-fc');
    expect(resolveClubMapping('Police FC').slug).toBe('kenya-police-fc');
  });
});
