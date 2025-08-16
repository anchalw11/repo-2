from marshmallow import Schema, fields, validate

class RegisterSchema(Schema):
    firstName = fields.Str(required=True, validate=validate.Length(min=1))
    lastName = fields.Str(required=True, validate=validate.Length(min=1))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    plan_type = fields.Str(required=True, validate=validate.Length(min=1))
    tradingData = fields.Dict(required=False)
