# Contract Review App

A simple web app for reviewing a contract. Upload a PDF, read it on the left, and ask questions about it in the chat on the right.

Built with plain HTML, CSS and JavaScript. No frameworks, no npm, no build tools.

## Key features

- **PDF preview:** upload a contract (click or drag and drop) and read it in the left panel.
- **Chat panel:** ask questions about the contract in the right panel.
- **Side by side:** both panels stay visible and scroll independently.
- **Sourced answers:** each reply shows the answer, the supporting contract citations, and a short reasoning note.
- **Webhook-powered:** your question and the PDF are sent to an n8n webhook, which returns the answer as JSON.

## How to run it locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser (Chrome or Edge recommended).
3. Click **Choose PDF** and pick a contract.
4. Type a question and press **Send**.

No installation is needed. Keep `index.html`, `styles.css` and `app.js` in the same folder.

## Webhook setup

The webhook URL is set at the top of `app.js` (`WEBHOOK_URL`). The app sends a multipart POST with:

- `file`: the uploaded PDF
- `message`: the user's question

It expects a JSON reply in this shape:

```json
{
  "response": "Answer based only on the contract",
  "citation": ["Section or page text that supports the answer"],
  "reasoning": "One or two sentences on how the citations support the answer"
}
```

Notes:

- The current URL is an n8n **test** URL. It only accepts a call after you click "Listen for test event" in the workflow. Switch to the production URL once the workflow is active.
- If the browser blocks the request, allow cross-origin requests (CORS) in the n8n Webhook node.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | Navy and orange styling |
| `app.js` | PDF upload and preview, chat, webhook call |
