/**
 * The teaching corpus: four short legal sources chosen so that each of the
 * failure modes discussed in class can be seen in the pipeline.
 *
 * Sources 1 through 3 are public-domain government texts reproduced from the
 * URLs given (the opinion is excerpted; omissions are marked). Source 4 is a
 * fictional engagement letter written for this course; the companies in it
 * do not exist.
 */

export type CorpusDocumentType = "opinion" | "rule" | "order" | "contract";

export interface CorpusDocument {
  id: string;
  /** Full title; also used as the header line in the source text. */
  title: string;
  /** Short label for badges. */
  shortTitle: string;
  type: CorpusDocumentType;
  jurisdiction: string;
  dateLabel: string;
  citation?: string;
  sourceUrl: string;
  note?: string;
  text: string;
}

const FLETCHER_TEXT = `United States Court of Appeals for the Fifth Circuit. No. 25-20086. Robert Fletcher, Plaintiff—Appellant, versus Experian Information Solutions, Incorporated; Bridgecrest Credit Company, L.L.C., Defendants—Appellees. Appeal from the United States District Court for the Southern District of Texas, USDC No. 4:24-CV-370. Filed February 18, 2026. Before Elrod, Chief Judge, and Smith and Wilson, Circuit Judges.

Jennifer Walker Elrod, Chief Judge: Pending before the court is an issue that has become central to the ongoing discussions of the relationship between law and technology: the use of artificial intelligence ("AI") in the drafting of legal documents. On December 18, 2025, the court issued an order to show cause as to why Appellant's counsel should not be sanctioned for including, in a brief, quotations, citations, and assertions that were not supported by the underlying case law.

Having considered counsel's responses to the show-cause order, we have determined that counsel used artificial intelligence to draft a substantial portion, if not all, of her reply brief and then failed to verify the accuracy of the content generated. We have also determined that she was not forthcoming in her response to the show-cause order. For those reasons, IT IS ORDERED that Heather Hersh pay to the clerk of court within 30 days a sanction of $2,500.

I. The first high-profile incident of AI-fabricated case citations in the federal courts occurred in the Southern District of New York. Larry Neumeister, Lawyers blame ChatGPT for tricking them into citing bogus case law, AP (June 8, 2023). In that case, the plaintiff's AI-generated brief cited seven nonexistent cases. Mata v. Avianca, Inc., 678 F. Supp. 3d 443, 449–51 (S.D.N.Y. 2023). For example, the brief cited a case called Varghese v. China Southern Airlines Co., which did not exist, and the federal reporter citation led to a different case altogether. Id. at 151. The brief listed our own distinguished colleague, Judge Patrick Higginbotham, as a member of the Varghese panel, even though that case was entirely fictional. Id. at 453 & n.7.

Fabrications of this sort have been dubbed "hallucinations." See Snell v. United Specialty Ins. Co., 102 F.4th 1208, 1230 (11th Cir. 2024) (Newsom, J., concurring) ("Put simply, [a generative AI program] 'hallucinates' when, in response to a user's query, it generates facts that, well, just aren't true—or at least not quite true."). The hallucination problem has no end in sight, as AI's tendency to fabricate results arises from the training and structures of AI programs. See Why language models hallucinate, OpenAI (Sep. 5, 2025). As time goes on, these hallucinations grow "all the more insidious and harder to guard against," as the models are more sophisticated and appear more truthful. Jane Bambauer, Negligent AI Speech: Some Thoughts About Duty, 3 J. Free Speech L. 343, 356 (2023). This problem now often manifests as false quotes or statements of law attributed to real cases, rather than the more easily recognizable fake cases.

Following the Mata case and other reports of AI hallucinations in court filings, our court appointed a three-judge AI Subcommittee to study the issue in Spring 2024. The Subcommittee developed a proposed rule. The rule would have required counsel and pro se litigants to certify either: (a) that no generative AI program was used to prepare any submitted document; or (b) if an AI program was used, that a human checked the AI-generated text for accuracy. Notice of Proposed Amendment to 5th Cir. R. 32.3 (Jan. 4, 2024).

We published the proposed rule on our court website and asked for public comment. Thirteen comments were submitted by judges, professors, and practitioners. Many of the comments reasoned that such a rule was unnecessary because existing rules such as Federal Rule of Civil Procedure 11 and Federal Rule of Appellate Procedure 46(b)(1)(B) already impose an obligation on counsel to submit accurate information to courts.

Ultimately, the Subcommittee recommended to the court that we decline to adopt the proposed rule, and we followed the Subcommittee's recommendation. We instead issued a notice on our court website reminding counsel of their obligation to review all filings for accuracy. In doing so, we concluded that existing rules were sufficient to deter misconduct related to generative AI use, without the need for a rule specific to generative AI. Federal Rule of Appellate Procedure 46(c), for instance, allows a court of appeals, after notice and an opportunity to show cause, to "discipline an attorney who practices before it for conduct unbecoming a member of the bar or for failure to comply with any court rule." We also have "inherent power to impose sanctions for abuse of the judicial process." Anderson v. Wells Fargo Bank, N.A., 953 F.3d 311, 315 (5th Cir. 2020). Other courts have noted that submitting a brief riddled with fabricated quotations and assertions is such an abuse. See Park v. Kim, 91 F.4th 610, 615 (2d Cir. 2024) (referring attorney to the Second Circuit's Grievance Panel under 2d Cir. R. 46.2 for failing to make inquiry into the validity of her argument).

Regrettably, despite numerous news stories, CLE presentations, scholarly articles, and judicial entreaties, AI-hallucinated case citations have increasingly become an even greater problem in our courts, and the problem shows no sign of abating. Damien Charlotin, a French lawyer and data scientist, maintains a database that tracks court orders related to AI-hallucinated content. As of the date of this order, Charlotin has identified 239 cases of hallucination by lawyers in the United States. Within our circuit, district courts have shouldered the burden of addressing AI hallucinations in court filings. It is a problem that is getting worse—not better. If it were ever an excuse to plead ignorance of the risks of using generative AI to draft a brief without verifying its output, it is certainly no longer so. To ethically use generative AI in the practice of law—which we do not dispute can be helpful if done properly and carefully—a lawyer must "ensure that the legal propositions and authority generated are trustworthy." ByoPlanet Int'l, LLC v. Johansson, 792 F. Supp. 3d 1341, 1347 (S.D. Fla. 2025). Failure to do so "abdicate[s] one's duty, waste[s] legal resources, and lower[s] the public's respect for the legal profession and judicial proceedings." Id.

II. A. A brief recitation of the facts underlying this case is helpful. This is an appeal of a sanctions award against Shawn Jaffer, plaintiff's counsel in the district court, and his law firm, Jaffer & Associates. Jaffer sued two defendants for violations of the Fair Credit Reporting Act. The gist of the case was that Robert Fletcher, Jaffer's client, was a victim of identity theft and someone else had opened an automobile finance account in his name.

The district court instead determined that "Mr. Jaffer had not done even a minimal investigation of Fletcher's claims before filing a suit seeking damages that were barred by law, or based on false factual allegations." As a sanction, the district court ordered Jaffer and his law firm to pay defendant Bridgecrest (a lender) about $20,000 in attorneys' fees under Federal Rule of Civil Procedure 11 and defendant Experian (a credit reporting agency) about $13,000 in attorneys' fees under 28 U.S.C. § 1927. We vacated that sanctions order, holding that Jaffer needed a greater opportunity to defend his pre-suit investigation and that the early discovery of the false allegations brought Jaffer's conduct outside the strictures of 28 U.S.C. § 1927, which only applies when an attorney "multiplies the proceedings." Fletcher v. Experian Info. Sols., Inc., No. 25-20086, 2026 WL 37428, at *3–5 (5th Cir. Jan. 6, 2026).

But a problem remained. Heather Hersh, counsel for plaintiff and a member of the Jaffer & Associates law firm, had filed a reply brief on appeal containing numerous inaccurate citations, quotations, and statements of fact. We issued a show-cause order, enumerating 16 instances of fabricated quotations and 5 additional serious misrepresentations of law or fact. We directed Hersh, the only attorney to sign the brief, to "explain whether and how she verified the accuracy of the propositions in her brief." We strongly suspected that Hersh had used AI to draft a substantial portion—if not the entirety—of her brief.

[The opinion's table of sixteen suspect quotations, each attributed to a real case, and its list of five further inaccurate citations and assertions are omitted from this excerpt.]

B. Hersh's response was disappointing. She asserted that she had "relied on publicly available versions of the cases, which [she] believed were accurate." Believing that response to be incredible on its face, the court directed Hersh to answer additional questions. Hersh answered these questions, noting that she "endeavored to answer each question directly and transparently." We address each question and Hersh's response in turn. [. . .]

Second, when asked what "publicly available versions of the cases" had led to the inaccuracies described above, Hersh named several well-known legal databases. The court does not find it credible that these sources produced the hallucinated quotations that appeared in Hersh's brief. The first source, Google Scholar, does not contain summaries of legal cases that could contain inaccurate quotes. While the second, third, and fourth sources—CourtListener, Justia, and FindLaw—do provide legal case summaries, we have reviewed the summaries for each case cited in Hersh's reply brief, and the problematic quotations and propositions are nowhere to be found. The remaining two sources, Casetext, which has been spun off into Thomas Reuter's CoCounsel, and vLex, are both generative AI products.

Third, when asked specifically about whether she used AI and how she verified the accuracy of the case citations, Hersch finally admitted to the use of AI, though she neglected to do so in her initial show-cause response. We do not find it credible that Hersh used AI solely to "help organize and structure [her] arguments and to break up overly long paragraphs." Even when asked directly, Hersh did not explain the steps she took to verify the factual assertions in her brief, so the court concludes that she took none. [. . .]

In sum, the court finds that Hersh used artificial generative intelligence to draft a substantial portion—if not all—of her reply brief and failed to check the brief for accuracy. It is also likely that she used artificial generative intelligence in her response to the show-cause order. Had Hersh accepted responsibility and been more forthcoming, it is likely that the court would have imposed lesser sanctions. However, when confronted with a serious ethical misstep, Hersh misled, evaded, and violated her duties as an officer of this court.

III. Modern generative AI may be a new technology, but the same sanctions rules apply, and the rules we have are well equipped to handle these types of cases. First, Rule 46(c) allows us to discipline an attorney who practices before us for "conduct unbecoming a member of the bar or for failure to comply with any court rule." Discipline under Rule 46(c) may include monetary sanctions. In re Violation of Rule 28(d), 635 F.3d 1352, 1360 (Fed. Cir. 2011); see 16AA Wright & Miller's Federal Practice and Procedure § 3992.2 (5th ed. 2025).

Conduct "unbecoming a member of the bar" is broad and includes making frivolous arguments and misrepresenting facts or law. See, e.g., United States v. Martinez-Martinez, 1999 WL 1330642, at *1 (5th Cir. Dec. 15, 1999) (show-cause order under Rule 46(c) for misrepresenting "a critical fact relating to jurisdiction"); Waldon v. Wal-Mart Stores, Inc., Store No. 1655, 943 F.3d 818, 825 (7th Cir. 2019) (noting that "conduct unbecoming a member of the bar" includes "deliberately misleading the court or displaying egregious misjudgment").

The conduct at issue in this case is certainly "unbecoming a member of the bar." Fed. R. App. P. 46(c). As discussed above, Hersh failed to check her own brief before submitting it, leading her to repeatedly misrepresent the law to the court. Cf. Fed. R. Civ. P. 11(b) and (c) advisory committee's note to 1993 amendment ("The rule . . . require[s] litigants to 'stop-and-think' before initially making legal or factual contentions . . . . A litigant's obligations . . . include reaffirming to the court and advocating positions contained in those pleadings and motions after learning that they cease to have any merit."); Tex. Disciplinary Rules Prof'l Conduct R. 3.01 ("A lawyer shall not . . . assert or controvert an issue [in a proceeding], unless the lawyer reasonably believes that there is a basis for doing so that is not frivolous."); Id. 3.03(a)(1) ("A lawyer shall not knowingly . . . make a false statement of material fact or law to a tribunal"); Id. 8.04(a)(3) (A lawyer shall not "engage in conduct involving dishonesty, fraud, deceit[,] or misrepresentation").

Second, we have the "inherent power to impose sanctions for abuse of the judicial process." Anderson, 953 F.3d at 315; see also Amarsingh v. Frontier Airlines, Inc., 2026 WL 352016 at *6 (10th Cir. Feb. 9, 2026) (noting a court's inherent authority to sanction in the context of a brief with AI-hallucinated citations). Submitting a brief riddled with fabricated quotations and assertions is such an abuse. See Park, 91 F.4th at 615 (noting that an "attempt to persuade a court or oppose an adversary by relying on fake opinions is an abuse of the adversary system"). Hersh's misleading the court as to the source of her errors further justifies sanctions under our inherent powers. See Ben E. Keith Co. v. Dining All., Inc., 80 F.4th 695, 703 (5th Cir. 2023) (affirming inherent-power sanctions where attorney discovered misrepresentation and failed to correct it).

We have recognized, in reviewing a district court's sanctions order, that "an admonition by the court may be an appropriate sanction, in instances where the attorney's sanctionable conduct was not intentional or malicious, where it constituted a first offense, and where the attorney had already recognized and apologized for his actions." Jenkins v. Methodist Hosp. of Dallas, Inc., 478 F.3d 255, 265 (5th Cir. 2007) (reviewing Rule 11 sanctions). These factors do not counsel against sanctions here.

IT IS ORDERED that Heather Hersh shall pay $2,500 in sanctions to the United States Court of Appeals for the Fifth Circuit within 30 days of this order.`;

const RULE_11_TEXT = `Rule 11. Signing Pleadings, Motions, and Other Papers; Representations to the Court; Sanctions

(a) Signature. Every pleading, written motion, and other paper must be signed by at least one attorney of record in the attorney's name—or by a party personally if the party is unrepresented. The paper must state the signer's address, e-mail address, and telephone number. Unless a rule or statute specifically states otherwise, a pleading need not be verified or accompanied by an affidavit. The court must strike an unsigned paper unless the omission is promptly corrected after being called to the attorney's or party's attention.

(b) Representations to the Court. By presenting to the court a pleading, written motion, or other paper—whether by signing, filing, submitting, or later advocating it—an attorney or unrepresented party certifies that to the best of the person's knowledge, information, and belief, formed after an inquiry reasonable under the circumstances:

(1) it is not being presented for any improper purpose, such as to harass, cause unnecessary delay, or needlessly increase the cost of litigation;

(2) the claims, defenses, and other legal contentions are warranted by existing law or by a nonfrivolous argument for extending, modifying, or reversing existing law or for establishing new law;

(3) the factual contentions have evidentiary support or, if specifically so identified, will likely have evidentiary support after a reasonable opportunity for further investigation or discovery; and

(4) the denials of factual contentions are warranted on the evidence or, if specifically so identified, are reasonably based on belief or a lack of information.

(c) Sanctions.

(1) In General. If, after notice and a reasonable opportunity to respond, the court determines that Rule 11(b) has been violated, the court may impose an appropriate sanction on any attorney, law firm, or party that violated the rule or is responsible for the violation. Absent exceptional circumstances, a law firm must be held jointly responsible for a violation committed by its partner, associate, or employee.

(2) Motion for Sanctions. A motion for sanctions must be made separately from any other motion and must describe the specific conduct that allegedly violates Rule 11(b). The motion must be served under Rule 5, but it must not be filed or be presented to the court if the challenged paper, claim, defense, contention, or denial is withdrawn or appropriately corrected within 21 days after service or within another time the court sets. If warranted, the court may award to the prevailing party the reasonable expenses, including attorney's fees, incurred for the motion.

(3) On the Court's Initiative. On its own, the court may order an attorney, law firm, or party to show cause why conduct specifically described in the order has not violated Rule 11(b).

(4) Nature of a Sanction. A sanction imposed under this rule must be limited to what suffices to deter repetition of the conduct or comparable conduct by others similarly situated. The sanction may include nonmonetary directives; an order to pay a penalty into court; or, if imposed on motion and warranted for effective deterrence, an order directing payment to the movant of part or all of the reasonable attorney's fees and other expenses directly resulting from the violation.

(5) Limitations on Monetary Sanctions. The court must not impose a monetary sanction:

(A) against a represented party for violating Rule 11(b)(2); or

(B) on its own, unless it issued the show-cause order under Rule 11(c)(3) before voluntary dismissal or settlement of the claims made by or against the party that is, or whose attorneys are, to be sanctioned.

(6) Requirements for an Order. An order imposing a sanction must describe the sanctioned conduct and explain the basis for the sanction.

(d) Inapplicability to Discovery. This rule does not apply to disclosures and discovery requests, responses, objections, and motions under Rules 26 through 37.`;

const STARR_ORDER_TEXT = `Mandatory Certification Regarding Generative Artificial Intelligence

All attorneys and pro se litigants appearing before the Court must, together with their notice of appearance, file on the docket a certificate attesting either that no portion of any filing will be drafted by generative artificial intelligence (such as ChatGPT or Harvey.AI) or that any language drafted by generative artificial intelligence will be checked for accuracy, using print reporters or traditional legal databases, by a human being. These platforms are incredibly powerful and have many uses in the law: form divorces, discovery requests, suggested errors in documents, anticipated questions at oral argument. But legal briefing is not one of them. Here's why. These platforms in their current states are prone to hallucinations and bias. On hallucinations, they make stuff up—even quotes and citations. Another issue is reliability or bias. While attorneys swear an oath to set aside their personal prejudices, biases, and beliefs to faithfully uphold the law and represent their clients, generative artificial intelligence is the product of programming devised by humans who did not have to swear such an oath. As such, these systems hold no allegiance to any client, the rule of law, or the laws and Constitution of the United States (or, as addressed above, the truth). Unbound by any sense of duty, honor, or justice, such programs act according to computer code rather than conviction, based on programming rather than principle. Any party believing a platform has the requisite accuracy and reliability for legal briefing may move for leave and explain why. Accordingly, the Court will strike any filing from a party who fails to file a certificate on the docket attesting that they have read the Court's judge-specific requirements and understand that they will be held responsible under Rule 11 for the contents of any filing that they sign and submit to the Court, regardless of whether generative artificial intelligence drafted any portion of that filing. A template Certificate Regarding Judge-Specific Requirements is provided here.`;

const ENGAGEMENT_LETTER_TEXT = `CUMBERLAND & ROSS LLP
Attorneys at Law

March 2, 2026

General Counsel
Sablefield Robotics, Inc.

Re: Engagement for the Sortwell Robotics Trademark Matter

Dear Counsel:

Thank you for asking Cumberland & Ross LLP (the "Firm") to represent Sablefield Robotics, Inc. ("Sablefield" or the "Client") in the matter described below. This letter sets out the terms of the engagement. Capitalized terms have the meanings given in Section 1.

1. Definitions.

(a) "Engagement" means the Firm's representation of Sablefield in the trademark dispute with Sortwell Robotics, Inc., including pre-suit investigation, demand correspondence, and, if authorized in writing, litigation.

(b) "Generative AI Tool" means any software that produces text, summaries, citations, or analysis in response to a prompt, including general-purpose chat assistants and legal research products with drafting or summarization features.

(c) "Verified Authority" means a case, statute, regulation, or rule that a lawyer at the Firm has read in a print reporter or in an official or commercial legal database, has confirmed stands for the proposition for which it is cited, and has checked for subsequent history.

(d) "Client Confidential Information" means all non-public information the Client provides to the Firm or that the Firm learns in the course of the Engagement, including technical information about Sablefield's robots and telemetry.

(e) "Work Product" means drafts, memoranda, correspondence, and filings the Firm prepares in the Engagement.

2. Scope of the Engagement. The Firm will advise Sablefield on the Sortwell dispute and prepare Work Product as reasonably necessary. The Firm is not engaged for patent prosecution, employment matters, or any other matter unless the parties agree in writing.

3. Staffing. A partner will supervise the Engagement. Associates, paralegals, and contract reviewers may perform work under that supervision. The Firm will tell the Client before assigning a lawyer who is not admitted in Tennessee to a substantive role.

4. Fees and Expenses. The Firm will bill hourly at the rates in Schedule A, in increments of one tenth of an hour, and will invoice monthly. Invoices are due within thirty days. Expenses, including filing fees and research database charges, are billed at cost.

5. Confidentiality. The Firm will hold Client Confidential Information in confidence and will use it only for the Engagement. The Firm will not enter Client Confidential Information into any system that retains user inputs for training or product improvement.

6. Conflicts. The Firm has run a conflict check against Sortwell Robotics, Inc. and Wickline Perception, Inc. and has identified no conflict. The Firm will notify the Client promptly if a conflict arises.

7. Use of Generative AI Tools.

(a) The Firm may use a Generative AI Tool to prepare Work Product, including to draft, summarize, and organize research, subject to this Section 7.

(b) The Firm will not cite any authority in Work Product unless it is a Verified Authority. Output from a Generative AI Tool, including a quotation, citation, or summary of a case, is not by itself a Verified Authority, regardless of which product produced it.

(c) A lawyer at the Firm remains responsible for every statement of fact and law in Work Product, whether or not a Generative AI Tool drafted it.

(d) The Firm will not enter Client Confidential Information into a Generative AI Tool unless the tool is covered by a written agreement that prohibits training on user inputs.

(e) On request, the Firm will tell the Client which Generative AI Tools were used to prepare a given item of Work Product.

8. Termination. Either party may end the Engagement on written notice. The Client remains responsible for fees and expenses incurred before termination, and the Firm will take reasonable steps to protect the Client's interests during the transition.

9. Notices. Notices under this letter must be in writing and delivered by hand, by courier, or by email with confirmation of receipt, to the addresses in Schedule B. A notice is effective when received.

10. Governing Law. This letter is governed by the law of the State of Tennessee and the Tennessee Rules of Professional Conduct.

If these terms are acceptable, please sign below and return a copy. We look forward to working with Sablefield.

Sincerely,

Cumberland & Ross LLP
By: Partner

Agreed and accepted:
Sablefield Robotics, Inc.
By: General Counsel
Date:`;

export const LEGAL_CORPUS: CorpusDocument[] = [
  {
    id: "fletcher",
    title:
      "Fletcher v. Experian Information Solutions, Inc., No. 25-20086 (5th Cir. Feb. 18, 2026) (sanctions order)",
    shortTitle: "Fletcher v. Experian (5th Cir. 2026)",
    type: "opinion",
    jurisdiction: "U.S. Court of Appeals, Fifth Circuit",
    dateLabel: "Feb. 18, 2026",
    citation: "No. 25-20086 (5th Cir. Feb. 18, 2026)",
    sourceUrl:
      "https://www.courtlistener.com/opinion/10795846/fletcher-v-experian-info-solutions/",
    note: "excerpt; footnotes and the table of fabricated quotations omitted",
    text: FLETCHER_TEXT,
  },
  {
    id: "frcp-11",
    title: "Federal Rule of Civil Procedure 11",
    shortTitle: "Fed. R. Civ. P. 11",
    type: "rule",
    jurisdiction: "Federal courts",
    dateLabel: "current text",
    citation: "Fed. R. Civ. P. 11",
    sourceUrl: "https://www.law.cornell.edu/rules/frcp/rule_11",
    text: RULE_11_TEXT,
  },
  {
    id: "starr-order",
    title:
      "Judge Brantley Starr (N.D. Tex.), Mandatory Certification Regarding Generative Artificial Intelligence (judge-specific requirement, first posted May 30, 2023)",
    shortTitle: "Starr standing order on AI (N.D. Tex.)",
    type: "order",
    jurisdiction: "U.S. District Court, Northern District of Texas",
    dateLabel: "May 30, 2023 (text as posted in 2024)",
    sourceUrl: "https://www.txnd.uscourts.gov/judge/judge-brantley-starr",
    text: STARR_ORDER_TEXT,
  },
  {
    id: "engagement-letter",
    title:
      "Engagement Letter, Cumberland & Ross LLP to Sablefield Robotics, Inc. (fictional teaching document, Mar. 2, 2026)",
    shortTitle: "Engagement letter (fictional)",
    type: "contract",
    jurisdiction: "Fictional; Tennessee law",
    dateLabel: "Mar. 2, 2026",
    sourceUrl: "https://github.com/vanderbilt-a-law-lab/RAG-Play",
    note: "written for this course; the companies do not exist",
    text: ENGAGEMENT_LETTER_TEXT,
  },
];

const SOURCE_HEADER_PATTERN = /^=== SOURCE (\d+): (.+?) ===$/gm;

export const formatSourceHeader = (index: number, doc: CorpusDocument): string =>
  `=== SOURCE ${index + 1}: ${doc.title} ===`;

export const buildCorpusText = (docs: CorpusDocument[] = LEGAL_CORPUS): string =>
  docs
    .map((doc, index) => `${formatSourceHeader(index, doc)}\n\n${doc.text.trim()}`)
    .join("\n\n\n");

/** The default source text shown in the Text Splitting tab. */
export const CORPUS_TEXT = buildCorpusText();

export interface SourceRange {
  index: number;
  title: string;
  shortTitle: string;
  start: number;
  end: number;
}

const shortTitleFor = (title: string): string => {
  const known = LEGAL_CORPUS.find((doc) => doc.title === title);
  if (known) {
    return known.shortTitle;
  }
  return title.length > 40 ? `${title.slice(0, 37)}...` : title;
};

/**
 * Locate every `=== SOURCE n: title ===` header in the text. Each range runs
 * from its header to the next header (or the end of the text), so any chunk
 * can be traced back to the document it was cut from.
 */
export const findSourceRanges = (text: string): SourceRange[] => {
  const headers: { index: number; title: string; start: number }[] = [];
  const pattern = new RegExp(SOURCE_HEADER_PATTERN.source, "gm");
  let match = pattern.exec(text);
  while (match !== null) {
    headers.push({
      index: Number(match[1]),
      title: match[2],
      start: match.index,
    });
    match = pattern.exec(text);
  }
  return headers.map((header, i) => ({
    index: header.index,
    title: header.title,
    shortTitle: shortTitleFor(header.title),
    start: header.start,
    end: i + 1 < headers.length ? headers[i + 1].start : text.length,
  }));
};

export const findSourceForOffset = (
  ranges: SourceRange[],
  offset: number
): SourceRange | undefined =>
  ranges.find((range) => offset >= range.start && offset < range.end);
