# Contributing

Start with the financial question and document units, timing and assumptions before changing model behavior. Add a failing hand-calculated or input-contract regression test, then implement and run the relevant checks. Do not turn undefined values into invented numbers, treat synthetic data as real observations, or tune a threshold against test labels.

Use Node 20+, pnpm 9.12.0 and Python 3.11/3.12. Install pinned dependencies using the lockfile. Run the README verification commands. API integration tests require a dedicated PostgreSQL database and delete test records. Never point them at a production or shared database.

PRs should state the behavioral change, economic interpretation, test evidence and limitations. Keep uploaded transaction data, artifacts, credentials and private account details out of commits. Independent review of financial and statistical changes is required before deployment.
