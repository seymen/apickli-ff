Feature: Making GET requests

  Scenario: should send a GET request to target
    When I GET /anything
    Then response code should be 200
    Then response body path $.method should be GET
