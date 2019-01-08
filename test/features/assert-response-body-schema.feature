Feature: Assert response body is valid according to json schema

  Scenario: should be valid
    When I GET /get
    Then response body should be valid according to schema file httpbin-get-response.schema
