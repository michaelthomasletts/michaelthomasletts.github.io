---
date: '2025-09-08T00:02:07-04:00'
draft: false
title: 'boto3-refresh-session and credential_process: where each fits'
---

I am not (yet) at liberty to disclose the names of various companies and institutions who depend upon `boto3-refresh-session` (or forked and modified it internally for their purposes); however, I *can* say that a cybersecurity team at a FAANG company and a prestigious Public Health department at a public university use `boto3-refresh-session`. Those dependents are among what I estimate to be around one hundred other developers, scientists, and teams across North America and Europe. `boto3-refresh-session` has also been featured in some notable newsletters.[^1]

A testimonial from one of the FAANG cybersecurity engineers who forked and lightly modified `boto3-refresh-session`:

> "Most of my work is on tooling related to AWS security, so I'm pretty choosy about boto3 credentials-adjacent code. I often opt to just write this sort of thing myself so I at least know that I can reason about it. But I found boto3-refresh-session to be very clean and intuitive [...] We're using the RefreshableSession class as part of a client cache construct [...] We're using AWS Lambda to perform lots of operations across several regions in hundreds of accounts, over and over again, all day every day. And it turns out that there's a surprising amount of overhead to creating boto3 clients (mostly deserializing service definition json), so we can run MUCH more efficiently if we keep a cache of clients, all equipped with automatically refreshing sessions."

If it sounds like I am defending `boto3-refresh-session` -- that's because it has been outright dismissed by a minority of developers online who do not seem to understand what set of problems it solves or *who* it is *for*. For example:

> "Just create profiles -- it works for every single credential type and will refresh automatically. I don't know why you would create a library for this when all SDKs work the same with profile configurations."

This is a *very* common misunderstanding. While profiles cover many cases, they don’t solve every scenario Python developers encounter. It is not merely frustrating for me to repeatedly come across this spurious criticism; I worry it may deter teams and individuals who would actually benefit from `boto3-refresh-session`.

I am therefore compelled to clarify *who exactly this package is for* and *exactly what problems it does and does not solve*. 

Arguably, it is not my responsibility to edify anyone about `credential_process`, etc; however, as the founder and core maintainer of `boto3-refresh-session`, it *is* my obligation to ensure the community understands, to the best of my ability, what this tool is and is *not*. More, if such misunderstandings are common then there are issues extending far beyond the scope of just this project. 

## *Some* examples of what *already* auto-refreshes (when used correctly):

The following bulletpoints are *not* an exhaustive list.[^2]

- EC2 instance roles (IMDS): Botocore’s EC2 provider fetches / rotates credentials from the instance metadata service automatically. No manual refresh needed in long-running apps if you let the default provider chain run.

- ECS / Fargate task roles (task metadata endpoint): Botocore’s ECS provider pulls / renews task role creds via the container credentials endpoint automatically. [^3]

- `credential_process` (in `~/.aws/config`): if the external process returns JSON with an `Expiration`, `botocore` treats it as refreshable and will re-invoke before expiry. (If you hardcode creds or the process omits expiration, you lose true refresh semantics.)

- `AssumeRole` via `profile` (`role_arn` + `source_profile`): using a named profile (not hardcoded env vars) lets `botocore` renew the STS session behind the scenes.

- Web identity (IRSA on EKS): the SDK exchanges the projected token and refreshes as needed.

## *Some* examples of when that isn’t true (common foot-guns for *Python* devs):

The following bulletpoints are also not an exhaustive list.[^2]

- You bypass the provider chain. Example: exporting `AWS_ACCESS_KEY_ID` | `SECRET` | `SESSION_TOKEN` from a one-off `aws sts assume-role` and then launching a long process. Or sidestepping the standard credential provider in ECS. Those tokens expire and will not auto-refresh. That is where `RefreshableSession(method="custom")` becomes helpful.

- You pass explicit credentials to `boto3.Session(...)`. Providing keys directly (or reading them once from a file) fixes the credentials for the life of the process — no refresh.

- Profiles without expiration semantics. If your `credential_process` doesn’t emit `Expiration`, the SDK can’t plan a refresh (it treats them as static/opaque).

- Network / metadata blocked. Enterprises that block IMDSv2 or ECS task endpoints (or container lacks the env wiring) break auto-refresh even on EC2 / ECS (as mentioned above).

- SSO & very long runtimes. SSO profiles refresh while the device token is valid, but headless, weeks-long daemons can still hit interactive renewal walls.[^4]

- IoT credentials (X.509). The AWS IoT credentials provider (mTLS to the IoT endpoint, role alias, then STS creds) is not a built-in `botocore` provider. Out of the box, the SDK won’t auto-renew those for you.

- `credential_process` binaries can be brittle, i.e. difficult to maintain and distribute. 

## Who `boto3-refresh-session` is for (and not)

`boto3-refresh-session` is for **Python developers** who need a robust, *Python-native* way to handle expiring credentials — whether because they can’t rely on `credential_process`, they’re embedding `boto3` in long-running daemons, or they’re working with IoT / X.509 flows that the standard provider chain doesn’t support.

`boto3-refresh-session` is *not* for people who use the standard ECS / EC2 credential provider, depend upon `credential_process` without friction, or, frankly, (there's no delicate way of saying this) do not understand the limitations and edge cases associated with profiles, AWS credential providers, etc.

## Reflections

`boto3-refresh-session` isn’t the easiest package to explain; it is a *niche* backend Python package. It doesn’t lend itself to a pithy, one-line slogan, which can make the README challenging to keep concise. In some ways, `boto3-refresh-session` is less about who it's for than not. Which is odd.

What reassures me is that the engineers and teams who found this project and adopted it tend to be highly competent, and so far the lack of open issues or pull requests suggests the library is stable and working as intended. 

Still, I want to make this tool accessible to the very developers I originally had in mind when I published this project — namely, engineers and data scientists who struggle with expiring credentials in long-lived processes and don’t want to hand-roll refresh logic (or can't - for whatever reason). My hope is this post clarifies common misconceptions about what this project is and is not, and why it exists.

If you’re a Python developer working with long-running workloads, IoT / X.509 flows, or any environment where the standard provider chain falls short, `boto3-refresh-session` exists so you can stop worrying about credentials and focus on your application. 

If you have questions, reach out via GitHub or any of the usual channels.

[^1]: [TL;DR Sec](https://tldrsec.com/p/tldr-sec-282) and [CloudSecList](https://cloudseclist.com/issues/issue-290/), to be specific.

[^2]: I won't spoonfeed you. I cannot possibly account for every single circumstance for every single AWS service or scenario. I am happy to clarify the more glaring examples, but I should not be expected to exhaustively list *everything*. Sorry - them's the brakes.

[^3]: This is why I [deprecated the `ecs` module](https://github.com/michaelthomasletts/boto3-refresh-session/pull/78).

[^4]: I have actually been asked by a cybersecurity engineer at a well-known security company to support SSO in `boto3-refresh-session` for exactly this reason. Admittedly, I have not found the time yet to develop a module for supporting SSO. But soon!