Feature: Making DELETE requests

  Scenario: should send a DELETE request to target
    When I DELETE /delete
    Then response code should be 200

  Scenario: should send a DELETE request to target
    When I DELETE /post
    Then response code should be 405
