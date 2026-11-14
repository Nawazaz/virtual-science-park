# Pitch (3-4 minutes)

1. **Problem** (30 s): information is scattered; members lack time to find funding, events, testbeds and partners.
2. **Solution** (30 s): agents where the AI proposes and the code checks. Every result traces back to a source, a rule and a test.
3. **Demo** (2 min): build a profile, show a Fact with its quote, edit an item, show the ranking change, Compare page, chat with an override attempt, "How was this made?".
4. **Value** (30 s):
   - **For a member company:** a useful starting profile before anyone fills in a questionnaire, built from their own public pages, with every fact quoted and linked so they can check it in seconds. Then one ranked list of funding, events, testing and news, each with why it may fit, what to check first, the deadline and a next step. Example from today's Vinnova data: *Innovative Startups 2026*, who can apply (limited companies at most 10 years old, at most 10 employees) and how much (up to SEK 500,000), shown on the card instead of buried in the call text.
   - **For Blue Science Park staff:** one view of shared interests across members, deadlines that matter to several members at once, and members whose profiles are still missing.
   - **Why they can trust it:** it says "possible match", never "eligible"; anything simulated is labelled; the assistant refuses override attempts and never shows another company's private data; every result opens "How was this made?".
5. **Next** (30 s):
   1. **All members:** import the full member list from Blue Science Park's website (56 members, with industry tags) and run the nightly job in batches, rebuilding only websites that changed.
   2. **Real accounts:** Supabase Auth and database-level access rules per company, replacing the demo accounts.
   3. **More real sources:** a live events feed (Blue Science Park's has no upcoming events today), testbeds added by staff, more funding programmes.
   4. **Alerts:** a weekly email digest of new possible matches and approaching deadlines.
   5. **Learn from feedback:** tune the score weights from members' votes once there are enough of them.
