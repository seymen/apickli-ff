Feature: Making PATCH requests

  Scenario: should send a PATCH request to target
    When I PATCH /anything
    Then response code should be 200
    Then response body path $.method should be PATCH

  Scenario: should send a PATCH request to target
    When I PATCH /post
    Then response code should be 405
