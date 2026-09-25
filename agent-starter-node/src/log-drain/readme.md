
## CONFIGURE LIVEKIT LOG DRAINS

# docs
-- https://docs.livekit.io/deploy/agents/log-drains/

# cmd
  lk agent update-secrets \
    --secrets "AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id --profile convonent-aws-3sep26)" \
    --secrets "AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key --profile convonent-aws-3sep26)" \
    --secrets "AWS_REGION=eu-central-1"

# output
-- Using project [convonet-staging]
-- Using agent [CA_ZjRGt6jti4vL]