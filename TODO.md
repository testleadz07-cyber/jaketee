# Jacketee TODO list

## Policy questions to answer before the next policy update

Added: 23 October 2026. These items are still awaiting answers. The code cannot confirm business practices, contracts or production account settings.

Record each answer and any supporting document below its question. Once confirmed, update the relevant policy and any affected site behavior, then check the item off. Do not publish guessed details.

### 1. Who legally owns Jacketee?

- [ ] What is the registered legal business name? Is Jacketee that name or a trading/brand name?
- [ ] What is the full business postal address and country of registration?
- [ ] Is there a business registration number that should appear on the website?
- [ ] Which governing-law and dispute-resolution wording is appropriate for the business and its customers?

**Why we need this:** Customers need to know who they are buying from and who is responsible for their information. A brand name and a city alone may not identify the legal business clearly.

**Who can help:** The business owner can supply registration documents and the address. A qualified legal adviser can confirm the governing-law and dispute wording.

### 2. How long do we keep customer information?

- [ ] How long should we keep orders, invoices and payment references?
- [ ] How long should we keep contact messages, group quotes and customer artwork?
- [ ] How long should we keep inactive accounts, sign-in logs and optional browsing activity?
- [ ] When someone asks for deletion, what can we remove, what must remain, and how long do backups retain copies?
- [ ] Who will handle deletion requests and implement the agreed retention/deletion schedule?

**Why we need this:** The policy should explain what actually happens to customer information. Some records may need to remain for tax, accounting or unresolved disputes; other records should not simply be kept forever without a reason. Publishing a retention period also means the business and software need to follow it.

**Who can help:** The owner and accountant can identify financial record requirements. A qualified legal adviser can review other obligations. The developer can implement the approved schedule and deletion process.

### 3. Which companies handle customer information?

- [ ] Which companies provide website hosting, database hosting, image storage, email and delivery services?
- [ ] In which countries or regions do those providers process customer information?
- [ ] Which relevant privacy/data-processing agreements are in place with them?
- [ ] Are any additional international-transfer arrangements or privacy representatives needed for the countries we serve?

**Why we need this:** Customer details pass through these services to process payments, store orders, send messages and deliver jackets. We should describe those arrangements accurately and avoid claiming agreements or protections that have not been verified.

**Who can help:** The owner or account administrator can supply provider names, account regions and contracts. The developer can check configuration without exposing credentials. A qualified legal adviser can review any required agreements and transfer safeguards.

### 4. What are our custom-order rules?

- [ ] How soon do customers normally receive a design proof, and is that timing a commitment or an estimate?
- [ ] How many revisions are included? When, if ever, do additional charges apply?
- [ ] How is a customer's final design approval recorded?
- [ ] Until which stage can a customer change or cancel an order?
- [ ] What refunds or charges apply before approval, after approval and after production starts?
- [ ] Do bulk orders require a deposit, and when is the balance due?
- [ ] When do we formally accept an order, rather than just acknowledge receiving it?

**Why we need this:** Customers and staff need the same understanding of changes, approval, cancellation, payment and timing. Clear rules help prevent disputes and stop the website from promising something the business cannot consistently provide.

**Who can help:** The owner and order/production team should define actual practices. A qualified legal adviser can check the terms, and the developer can ensure checkout, emails and forms match them.

### 5. Which countries do we sell to, and which customer rules apply?

- [ ] What are our main sales countries, and are we actively targeting customers in the UK, EU, California or other regions?
- [ ] Do the current 10-day stock return window and 15% / minimum $35 restocking charge need different treatment for particular customers?
- [ ] What cancellation periods, refund deadlines and delivery-charge refunds apply in those markets?
- [ ] Which privacy laws apply to the business and its provider arrangements?
- [ ] Do we need to support Global Privacy Control (GPC), a browser setting that automatically requests an opt-out of certain data sale or sharing?

**Why we need this:** A single store policy may not fit every selling country. Some customers may have rights that a store policy cannot shorten or remove. The need for a browser privacy opt-out also depends on the laws and data uses that actually apply.

**Who can help:** The owner can identify sales destinations and target markets. A qualified legal adviser should assess applicable rules. The developer can implement confirmed regional requirements and update relevant return information and structured data.

### 6. What does the live website store and measure?

- [ ] Inspect the production site before consent, after accepting each category and after withdrawing consent.
- [ ] Check sign-in, browsing, saved designs, checkout and both available payment flows.
- [ ] Record the actual cookie/storage names, providers, purposes and expiry times.
- [ ] Confirm Google Analytics retention and enhanced-measurement settings, and check for any tags installed outside this repository.
- [ ] Update the cookie inventory if production settings differ from what is currently documented.

**Why we need this:** The source code shows the intended behavior, but Google, payment and sign-in services can also depend on provider account settings. A live check is needed to confirm exactly what is stored or sent and whether the controls work as described.

**Who can help:** The developer can inspect browser storage and network behavior. The owner or account administrator may need to provide access to provider settings. Do not put passwords, API keys or private customer information in this TODO file.

### 7. How do we handle children's details, newsletters and customer artwork?

- [ ] Do school or team orders include children's names, photos or other personal details? Who is authorized to provide them?
- [ ] How do newsletter subscribers give permission, and does the unsubscribe process work?
- [ ] Do we publish customer designs, logos, photos or finished-order images in a portfolio, social media or advertising?
- [ ] Where do we record permission for that publication? Review any existing published customer material.
- [ ] Are advertising or retargeting tools planned? Review notices and consent requirements before enabling them.

**Why we need this:** Permission to manufacture a jacket does not automatically cover marketing emails or publication of a customer's name, photo or logo. School orders can also involve children's information that needs particular care.

**Who can help:** The owner, support team and marketing team can explain current practices and permissions. A qualified legal adviser can confirm the appropriate process. The developer can implement the approved controls.

## Supporting audit

See [Policy confirmations and technical follow-up](docs/policy-confirmations.md) for the detailed implementation notes and official research sources. Keep both files aligned when these questions are resolved.
