Feature: Making DELETE requests

  Scenario: should send a DELETE request to target
    When I DELETE /anything
    Then response code should be 200
    And response body path $.method should be DELETE
