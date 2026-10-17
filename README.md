# R2 package image storage

Package image uploads use Cloudflare R2's S3-compatible API. Set these server-side
variables in `.env.local` and in the deployment environment:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://<public-bucket-domain>
```

Configure the bucket's public domain in Cloudflare and set `R2_PUBLIC_BASE_URL`
to that HTTPS origin (or origin plus path prefix). `R2_ENDPOINT` is the private
S3 API endpoint and cannot be used as the image URL. The public domain preserves
the existing behavior where package images can be displayed from their saved
URLs. Never expose the R2 access key or secret in a `NEXT_PUBLIC_` variable.

Invoice attachments use a separate **private** R2 bucket. Set a bucket-scoped
R2 API token with object read/write permission for that bucket in server-only
environment variables:

```env
R2_INVOICE_BUCKET_NAME=
R2_INVOICE_ACCESS_KEY_ID=
R2_INVOICE_SECRET_ACCESS_KEY=
```

Invoice storage reuses `R2_ACCOUNT_ID` and `R2_ENDPOINT`, but not the package
image bucket or its public URL. Do not enable public access or configure a
public domain for the invoice bucket. Downloads are served only through the
authenticated application route.
