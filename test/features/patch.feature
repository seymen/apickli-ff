Feature: Making PATCH requests

  Scenario: should send a PATCH request to target
    When I PATCH /patch
    Then response code should be 200

  Scenario: should send a PATCH request to target
    When I PATCH /post
    Then response code should be 405
