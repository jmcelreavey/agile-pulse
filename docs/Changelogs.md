# Changelogs

Changelogs turn a sprint's completed tasks into release notes for customers and stakeholders.

## Using them

1. On a sprint, open the changelog section, pick the tasks to include and generate a draft. Tasks are grouped into new features, enhancements and bug fixes.
2. Edit the draft in the rich text editor.
3. Publish it. Published changelogs appear in the [customer portal](CustomerPortal.md) and on the **Changelogs** page.
4. Email it to customers, or use **Save as PDF** to print it from the browser.

## AI and the built-in writer

With `OPENAI_API_KEY` set, the draft is written by OpenAI from the task names and descriptions. Without it, a built-in writer groups tasks by keywords in their names ("fix" and "bug" go under bug fixes, "improve" and "refactor" under enhancements, the rest under new features) and writes plain past-tense bullet points. Either way, the draft is only a starting point that you edit before publishing.

## Why it works this way

- **Release notes are a chore that follows directly from the chart.** The completed tasks are already there; a draft saves the blank page.
- **Print to PDF** uses the browser instead of a server-side renderer, which keeps the app free to run on Cloudflare's free plan.
